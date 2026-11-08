# Applying the OpenAI migration patch

Recommended target: `C:\Users\User\Desktop\ELEVONI`

1. Make a backup of the current ELEVONI folder or commit the current state to Git.
2. Extract the patch ZIP into the existing ELEVONI folder and allow the included files to overwrite the older versions.
3. Do not copy any `.env` file from another machine and do not commit secrets.
4. Add the OpenAI and ElevenLabs variables from `backend/.env.example` to the backend's local `.env` and production backend environment settings.
5. Deploy the backend first. Then run customer and vendor frontend production builds, test locally, and deploy the frontends.
6. Keep the existing ElevenLabs voice IDs in the backend environment. Configure a dedicated ID for each language that is actually offered.

The patch keeps old `/api/n-atlas/...` routes as aliases, but the updated frontends use `/api/assistant/customer/...` and `/api/assistant/vendor/...`.

The previous `shared/natlasConfig.mjs` file is retained as a compatibility shim for any old imports; new code uses `shared/assistantConfig.mjs`.
