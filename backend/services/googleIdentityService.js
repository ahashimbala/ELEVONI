import { OAuth2Client } from "google-auth-library";

export const createGoogleIdentityVerifier = (oauthClient) => async (idToken, audience) => {
    if (!audience) {
        const error = new Error("Google sign-in is not configured");
        error.code = "GOOGLE_CONFIG_MISSING";
        throw error;
    }
    try {
        const ticket = await oauthClient.verifyIdToken({ idToken, audience });
        const payload = ticket.getPayload();
        if (!payload?.sub || !payload.email || payload.email_verified !== true) {
            const error = new Error("Google identity is missing verified claims");
            error.code = "GOOGLE_TOKEN_INVALID";
            throw error;
        }
        return {
            sub: payload.sub,
            email: payload.email.trim().toLowerCase(),
            name: typeof payload.name === "string" ? payload.name.trim() : ""
        };
    } catch (cause) {
        if (cause?.code === "GOOGLE_TOKEN_INVALID") throw cause;
        const error = new Error("Google ID token verification failed", { cause });
        error.code = "GOOGLE_TOKEN_INVALID";
        throw error;
    }
};

export const verifyGoogleIdToken = createGoogleIdentityVerifier(new OAuth2Client());