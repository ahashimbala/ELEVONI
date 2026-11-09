# Elevoni Dynamic ASR 1B on Modal

This service replaces the previous Pocket 300M INT8 deployment with Modular's fine-tuned **Dynamic ASR 1B `real/` checkpoint**.

## Runtime

- Modal app: `elevoni-dynamic-asr-1b`
- Model: `Modularcomputing/dynamic-asr`, `real/model.pt`
- Runtime: PyTorch + fairseq2 + `omnilingual-asr`
- GPU: NVIDIA A10 (24 GB class)
- Audio: browser WebM/MP4/OGG/WAV → FFmpeg → mono 16 kHz float32
- API: authenticated multipart `POST` to the Modal function endpoint
- Secret: existing Modal secret `elevoni-asr-secret`, key `ELEVONI_ASR_API_KEY`

The 1B model is language-agnostic. The selected language is retained as Elevoni request metadata; it is not sent as a model language hint.

## Deploy

Run from this directory in PowerShell:

```powershell
modal deploy modal_app.py
```

The image pins PyTorch 2.8.0 + CUDA 12.8 and fairseq2 0.6.0 + CUDA 12.8 because fairseq2 native extensions must match the installed PyTorch/CUDA ABI. The image downloads the `real/model.pt` checkpoint and `transcribe.py` at build time. The base fairseq2 model assets may be fetched on the first model load.

The existing `elevoni-asr-secret` Modal secret is reused. Do not create a new key if the current secret already contains `ELEVONI_ASR_API_KEY`.

## Backend environment

After deployment, copy the new HTTPS URL printed by Modal into the **backend Vercel project only**:

```env
ASSISTANT_ASR_PROVIDER=dynamic-asr
DYNAMIC_ASR_MODAL_URL=https://YOUR-NEW-MODAL-ENDPOINT
DYNAMIC_ASR_MODAL_API_KEY=the-same-value-as-ELEVONI_ASR_API_KEY
DYNAMIC_ASR_TIMEOUT_MS=150000
```

Redeploy the backend after changing the environment. Keep the OpenAI transcription credentials available as a rollback option; `ASSISTANT_ASR_PROVIDER=openai` switches the transcription route back to OpenAI.

## Verify

Test a short recording in Nigerian English, Pidgin, Hausa, Igbo and Yoruba. Confirm the Modal response has:

```json
{
  "success": true,
  "text": "...",
  "model": "dynamic-asr-1b-real"
}
```

Do not treat a successful Modal deployment as proof that inference works. The first live request must confirm GPU availability, model download/cache and an actual transcript.

## Licence

The Dynamic ASR fine-tuned weights are published under **CC BY-SA 4.0**. The model card provides attribution details for the source corpora and Meta Omnilingual ASR. Review and preserve those attribution/share-alike obligations before distributing model weights or derivatives. The inference code is Apache-2.0. See the model card: https://huggingface.co/Modularcomputing/dynamic-asr
