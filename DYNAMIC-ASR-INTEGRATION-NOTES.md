# Elevoni Dynamic ASR Pocket integration

## What changed

- Added `modal-asr/modal_app.py`: Modal-hosted Dynamic ASR Pocket 300M INT8 service. It downloads the model files during image build, decodes browser audio with FFmpeg, resamples to mono 16 kHz, and runs the upstream Pocket inference implementation.
- Added `backend/services/dynamicAsr.js`: authenticated multipart client for the Modal endpoint.
- Added `backend/services/assistantTranscription.js`: provider switch between Dynamic ASR and the existing OpenAI transcription path.
- Updated both customer and approved-vendor transcription controllers to use the provider switch. Existing chat intelligence and ElevenLabs speech generation are unchanged.
- Added backend environment examples and focused Dynamic ASR client tests.

## Provider selection

Set `ASSISTANT_ASR_PROVIDER=dynamic-asr` in backend production only after Modal is deployed and both Modal URL and shared API key are configured. Set it to `openai` to roll back.

## Modal deployment

See `modal-asr/README.md`. The app name is `elevoni-dynamic-asr-pocket`; create the Modal secret `elevoni-asr-secret` with key `ELEVONI_ASR_API_KEY` before deployment.

## Verification status

- JavaScript syntax checks passed for the new service, provider router and both changed controllers.
- Python syntax compilation passed for `modal-asr/modal_app.py`.
- Focused mocked-client tests are included; they still need to be run in the backend environment.
- Modal deployment, model image build, live endpoint test, Vercel production configuration and real-device speech tests have not been performed from this workspace.

## Model licence and accuracy

Dynamic ASR Pocket's fine-tuned weights are CC BY-SA 4.0; its inference code is Apache-2.0. Preserve attribution and review share-alike obligations for any redistribution/adaptation. The model is experimental and may omit punctuation/casing; verify names, quantities, locations and prices. Its own benchmark warns that spontaneous, noisy, phone and code-switched speech can be harder than its read-speech test data.
