"""Elevoni Dynamic ASR 1B (real checkpoint) Modal transcription service.

Model weights: CC BY-SA 4.0. Inference code: Apache-2.0.
The 1B checkpoint is loaded with PyTorch/fairseq2 on a Modal A10 GPU.
"""
import hmac
import os
import sys
import subprocess
from pathlib import Path

import modal
from fastapi import File, Header, HTTPException, UploadFile

APP_NAME = "elevoni-dynamic-asr-1b"
MODEL_DIR = "/opt/dynamic-asr"
MAX_AUDIO_BYTES = 12 * 1024 * 1024
SAMPLE_RATE = 16_000

# fairseq2's native extension must match the installed PyTorch/CUDA build.
# This image pins PyTorch 2.8.0 + CUDA 12.8 and fairseq2 0.6.0 + CUDA 12.8.
image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install("ffmpeg", "libsndfile1")
    .run_commands(
        "python -m pip install --no-cache-dir --index-url https://download.pytorch.org/whl/cu128 --extra-index-url https://pypi.org/simple torch==2.8.0 torchaudio==2.8.0",
        "python -m pip install --no-cache-dir --index-url https://fair.pkg.atmeta.com/fairseq2/whl/pt2.8.0/cu128 --extra-index-url https://pypi.org/simple fairseq2==0.6.0",
       "python -m pip install --no-cache-dir omnilingual-asr==0.2.0 'numpy<2' 'pyarrow>=20,<26' 'fastapi>=0.115,<1' 'python-multipart>=0.0.20' 'soundfile>=0.12,<1' 'scipy>=1.13,<2' 'huggingface_hub>=0.27,<2'",
        "python -c \"import torch, fairseq2, omnilingual_asr; assert torch.version.cuda is not None; print('PyTorch', torch.__version__, 'CUDA build', torch.version.cuda)\"",
    )
    .env({"HF_HOME": "/root/.cache/huggingface", "HF_HUB_DISABLE_TELEMETRY": "1"})
    .run_commands(
        "mkdir -p /opt/dynamic-asr",
        "python -c \"from huggingface_hub import hf_hub_download; hf_hub_download(repo_id='Modularcomputing/dynamic-asr', filename='real/model.pt'); hf_hub_download(repo_id='Modularcomputing/dynamic-asr', filename='transcribe.py', local_dir='/opt/dynamic-asr')\"",
    )
)

app = modal.App(APP_NAME, image=image)
_asr = None


def load_model():
    """Load the fine-tuned 1B real-speech checkpoint once per warm container."""
    global _asr
    if _asr is not None:
        return _asr

    import torch

    if not torch.cuda.is_available():
        raise RuntimeError("The Dynamic ASR 1B container has no CUDA GPU. Check the Modal GPU configuration and CUDA-compatible PyTorch install.")

    script = Path(MODEL_DIR) / "transcribe.py"
    if not script.is_file():
        raise RuntimeError("Dynamic ASR transcribe.py was not downloaded into the Modal image.")
    sys.path.insert(0, str(Path(MODEL_DIR)))
    from transcribe import DynamicASR

    # The model card documents DynamicASR('real') as the default fine-tuned 1B checkpoint.
    print(f"[Elevoni Dynamic ASR 1B] Loading on {torch.cuda.get_device_name(0)}")
    _asr = DynamicASR("real")
    return _asr


def decode_audio(audio: bytes):
    """Decode browser audio to mono float32 16 kHz WAV for Dynamic ASR."""
    import io
    import numpy as np
    import soundfile as sf

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
        waveform, sample_rate = sf.read(io.BytesIO(converted), dtype="float32")
    except Exception as exc:
        raise HTTPException(status_code=422, detail="Audio format could not be decoded. Please record again.") from exc

    if waveform.ndim == 2:
        waveform = waveform.mean(axis=1)
    waveform = np.asarray(waveform, dtype=np.float32).reshape(-1)
    if int(sample_rate) != SAMPLE_RATE:
        raise HTTPException(status_code=422, detail="Audio could not be normalised to 16 kHz. Please record again.")
    if waveform.size < SAMPLE_RATE // 10:
        raise HTTPException(status_code=422, detail="Recording is too short or contains no clear speech.")
    return waveform


@app.function(
    gpu="A10",
    cpu=4,
    memory=16_384,
    timeout=240,
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
    try:
        model = load_model()
        transcript = model(waveform, SAMPLE_RATE)
        if isinstance(transcript, dict):
            transcript = transcript.get("text", "")
        elif isinstance(transcript, (tuple, list)):
            transcript = transcript[0] if transcript else ""
        transcript = str(transcript or "").strip()
    except HTTPException:
        raise
    except Exception as exc:
        # Keep the provider's internal details out of the public response.
        print(f"[Elevoni Dynamic ASR 1B] inference failed: {type(exc).__name__}: {str(exc)[:240]}")
        raise HTTPException(status_code=502, detail="Dynamic ASR could not process this recording. Please try again.") from exc

    if not transcript:
        raise HTTPException(status_code=422, detail="No clear speech was detected. Please try again.")

    return {
        "success": True,
        "text": transcript[:5000],
        "model": "dynamic-asr-1b-real",
        "durationSeconds": round(len(waveform) / SAMPLE_RATE, 2),
        "device": "cuda",
    }
