"""Elevoni Dynamic ASR Pocket (300M INT8) Modal service.

Model weights are CC BY-SA 4.0; inference code is Apache-2.0.
"""
import hmac
import importlib.util
import io
import os
import subprocess
from pathlib import Path

import modal
import numpy as np
from fastapi import File, Header, HTTPException, UploadFile


APP_NAME = "elevoni-dynamic-asr-pocket"
MODEL_DIR = "/opt/dynamic-asr/pocket"
MODEL_REPO = "Modularcomputing/dynamic-asr"
MAX_AUDIO_BYTES = 12 * 1024 * 1024
SAMPLE_RATE = 16_000

image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install("ffmpeg")
    .pip_install(
        "fastapi>=0.115,<1",
        "python-multipart>=0.0.20",
        "onnxruntime>=1.20,<2",
        "numpy>=1.26,<3",
        "soundfile>=0.12,<1",
        "scipy>=1.13,<2",
        "huggingface_hub>=0.27,<2",
    )
    .run_commands(
        "python -c \"from huggingface_hub import snapshot_download; "
        "snapshot_download(repo_id='Modularcomputing/dynamic-asr', "
        "allow_patterns=['pocket/model_int8.onnx','pocket/vocab.json',"
        "'pocket/transcribe_pocket.py'], local_dir='/opt/dynamic-asr')\""
    )
)
app = modal.App(APP_NAME, image=image)
_asr = None
_transcribe_long = None


def load_model():
    global _asr, _transcribe_long
    if _asr is not None:
        return _asr, _transcribe_long
    script = Path(MODEL_DIR) / "transcribe_pocket.py"
    spec = importlib.util.spec_from_file_location("dynamic_asr_pocket", script)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    _asr = module.PocketASR(
        model=str(Path(MODEL_DIR) / "model_int8.onnx"),
        vocab=str(Path(MODEL_DIR) / "vocab.json"),
        threads=4,
    )
    _transcribe_long = module.transcribe_long
    return _asr, _transcribe_long


def decode_audio(audio: bytes) -> np.ndarray:
    """Decode browser audio (webm/ogg/mp4/wav) to mono float32 16 kHz."""
    import soundfile as sf
    from scipy.signal import resample_poly
    try:
        converted = subprocess.run(
            ["ffmpeg", "-hide_banner", "-loglevel", "error", "-i", "pipe:0",
             "-ac", "1", "-ar", str(SAMPLE_RATE), "-f", "wav", "pipe:1"],
            input=audio,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            timeout=30,
            check=True,
        ).stdout
        waveform, sample_rate = sf.read(
            io.BytesIO(converted), dtype="float32", always_2d=True
        )
    except Exception as exc:
        raise HTTPException(status_code=422, detail="Audio format could not be decoded. Please record again.") from exc

    waveform = waveform.mean(axis=1).astype(np.float32)
    if sample_rate != SAMPLE_RATE:
        from math import gcd
        divisor = gcd(int(sample_rate), SAMPLE_RATE)
        waveform = resample_poly(
            waveform, SAMPLE_RATE // divisor, int(sample_rate) // divisor
        ).astype(np.float32)
    if waveform.size < SAMPLE_RATE // 10:
        raise HTTPException(status_code=422, detail="Recording is too short or contains no clear speech.")
    return waveform


@app.function(
    cpu=4,
    memory=4096,
    timeout=120,
    scaledown_window=300,
    secrets=[modal.Secret.from_name("elevoni-asr-secret")],
)
@modal.fastapi_endpoint(method="POST", docs=False)
async def transcribe(
    file: UploadFile = File(...),
    authorization: str = Header(default=""),
):
    expected = os.environ.get("ELEVONI_ASR_API_KEY", "")
    supplied = authorization.removeprefix("Bearer ").strip()
    if not expected or not hmac.compare_digest(supplied, expected):
        raise HTTPException(status_code=401, detail="Unauthorized")

    audio = await file.read()
    if not audio:
        raise HTTPException(status_code=400, detail="Audio file is empty.")
    if len(audio) > MAX_AUDIO_BYTES:
        raise HTTPException(status_code=413, detail="Recording exceeds the 12 MB limit.")

    waveform = decode_audio(audio)
    model, transcribe_long = load_model()
    transcript = transcribe_long(model, waveform).strip()
    if not transcript:
        raise HTTPException(status_code=422, detail="No clear speech was detected. Please try again.")

    return {
        "success": True,
        "text": transcript[:5000],
        "model": "dynamic-asr-pocket-300m-int8",
        "durationSeconds": round(len(waveform) / SAMPLE_RATE, 2),
    }
