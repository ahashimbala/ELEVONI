# Elevoni Dynamic ASR Pocket on Modal

This service hosts Modular's Dynamic ASR Pocket 300M INT8 ONNX model on Modal. It accepts browser-recorded audio, decodes it with FFmpeg, resamples it to mono 16 kHz, and returns a transcript.

## 1. Deploy

From this directory, with the Modal CLI installed and authenticated. On Windows PowerShell:

```powershell
modal setup
$env:ELEVONI_ASR_API_KEY = [Convert]::ToHexString([Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
modal secret create elevoni-asr-secret ELEVONI_ASR_API_KEY=$env:ELEVONI_ASR_API_KEY
Write-Output $env:ELEVONI_ASR_API_KEY
```

Copy the generated value for the Vercel backend environment variable in step 2. Do not send it in chat or commit it to Git.

The Modal app already attaches that secret to its transcription endpoint.

Deploy:

```bash
modal deploy modal_app.py
```

Copy the HTTPS endpoint URL printed by Modal.

## 2. Configure the Elevoni backend

In the backend Vercel project, set these Production environment variables:

```env
ASSISTANT_ASR_PROVIDER=dynamic-asr
DYNAMIC_ASR_MODAL_URL=https://YOUR-MODAL-ENDPOINT.modal.run
DYNAMIC_ASR_MODAL_API_KEY=THE_SAME_LONG_RANDOM_SECRET
DYNAMIC_ASR_TIMEOUT_MS=90000
```

Redeploy the backend after saving the variables. Do not put the secret in either frontend.

## 3. Smoke test

Send a real audio file as multipart field `file`:

```bash
curl -X POST "https://YOUR-MODAL-ENDPOINT.modal.run" \
  -H "Authorization: Bearer THE_SAME_LONG_RANDOM_SECRET" \
  -F "file=@sample.webm"
```

Expected response shape:

```json
{
  "success": true,
  "text": "...",
  "model": "dynamic-asr-pocket-300m-int8",
  "durationSeconds": 4.2
}
```

## 4. Important

- Pocket is language-agnostic: do not send Hausa/Igbo/Yoruba language codes to the model. Elevoni returns its selected language as request metadata.
- The 300M INT8 model is CPU-based; the Modal function requests 4 CPUs and 4 GiB RAM.
- The first Modal image build downloads the model files; subsequent starts use the baked image.
- Keep the previous OpenAI transcription provider available by setting `ASSISTANT_ASR_PROVIDER=openai` if rollback is needed.
- Model attribution: Dynamic ASR by Modular (Modularcomputing), based on Meta Omnilingual ASR. Pocket fine-tuned weights are CC BY-SA 4.0; the Pocket inference code is Apache-2.0. Commercial use is possible under CC BY-SA 4.0, but attribution and share-alike obligations apply to adaptations/redistributions. Review the [model card](https://huggingface.co/Modularcomputing/dynamic-asr) and its licence before production use.
- Test Hausa, Igbo, Yoruba, Pidgin and Nigerian English with real phone recordings. The model can omit punctuation/casing and make errors in quantities, names and code-switching.
