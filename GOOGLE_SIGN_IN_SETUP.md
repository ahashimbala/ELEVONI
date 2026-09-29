# Google sign-in setup

Google sign-in is an additional provider for Elevoni's existing JWT session. The browser uses Google Identity Services and the backend verifies the returned ID token with Google's `google-auth-library` before issuing Elevoni's normal JWT.

## Environment

Configure the same Google OAuth 2.0 **Web application** client ID in both deployments:

- Frontend/Vercel: `VITE_GOOGLE_CLIENT_ID`
- Backend/Vercel: `GOOGLE_CLIENT_ID`

Use the corresponding `.env.example` files for local setup. The client ID is public; never put a Google client secret or `JWT_SECRET` in the frontend.

## Google Cloud Console

1. Create or select a Google Cloud project and configure the OAuth consent screen.
2. Create an OAuth 2.0 Client ID with application type **Web application**.
3. Add `https://elevonifarms.vercel.app` under **Authorized JavaScript origins**. Add local development origins such as `http://localhost:5173` only when needed.
4. Copy the same client ID into both environment variables above and redeploy frontend and backend.
5. This GIS popup flow does not require an authorized redirect URI.

Google verifies the token audience, signature, issuer, and expiry. Elevoni additionally requires a verified email. New Google accounts are customers; Google sign-in is blocked for admin accounts. A verified Google email may link to an existing customer account with the same email.
