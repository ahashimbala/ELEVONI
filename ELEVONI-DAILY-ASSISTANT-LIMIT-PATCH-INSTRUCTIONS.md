# Patch instructions

Extract this ZIP into the root of your existing `ELEVONI` project folder:

`C:\Users\User\Desktop\ELEVONI`

Keep the folder structure. Allow the listed files to overwrite older versions. Do not replace the entire project with this patch.

## Required backend environment variable

In the backend Vercel project, add:

- `ASSISTANT_USAGE_HMAC_SECRET` — random secret, at least 32 characters.
- `ASSISTANT_DAILY_LIMIT_TIME_ZONE` — `Africa/Lagos` (optional; default is already `Africa/Lagos`).

Generate a secret locally with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Do not put this secret in frontend or vendor-portal environment variables. Do not commit `.env`.

Deploy the backend first. Then deploy the storefront and vendor portal so both clients send the persistent anonymous visitor ID header.

See `ELEVONI-DAILY-ASSISTANT-LIMIT-UPDATE.md` for behaviour, testing notes and the production checklist.
