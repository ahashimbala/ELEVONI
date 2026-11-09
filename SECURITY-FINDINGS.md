# Elevoni source-level security findings

**Source archive:** `ELEVONI-SECURITY-LEGAL-SEO-REVIEW.zip`  
**Review date:** 9 November 2026

## Changes made in this update

| Area | Change | Status |
|---|---|---|
| API headers | Added baseline security headers; removed Express identification | Implemented in source |
| Request sizes | Reduced JSON and URL-encoded body limits | Implemented in source |
| Rate limiting | Added process-local limits for mutations, auth and public buyer/privacy forms | Implemented; shared edge limiter still required |
| Authentication | Preserved JWT authentication and role checks; added login/register/Google limits; customer password hash cost raised to bcrypt 12 | Implemented in source |
| Error logging | Replaced several raw error-object logs with structured name/code/status logs | Implemented in source |
| CORS | Kept explicit origin allowlist; stopped echoing rejected Origin in API error response | Implemented in source |
| Uploads | Reduced generic media upload ceiling from 100 MB to 25 MB | Implemented in source |
| Privacy requests | Added public intake and admin-only request queue | Implemented in source |
| Cookie consent | Analytics waits for opt-in; reject disables analytics and clears GA cookies | Implemented in source |
| SEO | Added sitemap, robots directives, canonical/social metadata and Organization/WebSite JSON-LD | Implemented in source |
| Admin/vendor indexing | Added noindex directives and response headers | Implemented in source |
| Voice input | Added microphone entry to buying requirement extraction | Implemented in source |

## Source observations and residual risks

- Admin API router already enforces JWT authentication and the `admin` role server-side.
- Vendor sales and buyer-match routes already use authenticated vendor checks and approved vendor profiles.
- Order payment verification already checks the authenticated order owner, payment reference, status, currency and amount with Paystack's server-side verification API.
- Cart and order routes are protected by customer/admin role checks; continue testing object-level ownership with multiple real test accounts.
- Authentication tokens are stored by the current frontend in browser storage. This remains exposed to successful same-origin script injection; a future migration to secure HttpOnly cookies would require a deliberate CSRF/session design and coordinated frontend/backend changes.
- Existing media uploads use MIME/extension checks and Cloudinary integration. MIME values can be spoofed; production should add content-signature validation, malware scanning and a stricter per-type upload policy.
- The CORS allowlist contains historical preview domains. Remove obsolete domains after confirming no active deployment depends on them.
- The API limiter is process-local and does not coordinate across serverless instances.
- The full repository Git history was not supplied.
- MongoDB Atlas network allowlist, database roles, encryption, backups and restore procedures are outside the source archive and were not inspected.
- Vercel account MFA, project/team permissions, deployment protection and production environment variables were not accessible.
- Paystack webhook handling was not found in the reviewed payment path; the current flow performs server-side transaction verification. If webhooks are added, verify signatures and make processing idempotent.
- No live security scan, penetration test, production deployment test, payment test or database integration test was run.

## Validation actually performed

- 8 focused backend tests passed: buyer-requirement tests and new security middleware tests.
- Full backend suite: 126 tests passed; 15 test files failed to load because dependencies such as `mongoose`, `express`, `cloudinary`, `jsonwebtoken` and `dotenv` were not installed in the isolated workspace. The source archive intentionally omitted `node_modules`.
- All backend JavaScript files passed `node --check`.
- 96 frontend/admin/vendor JavaScript and JSX files passed TypeScript transpilation/parser checks.
- All JSON configuration files and the XML sitemap parsed successfully.
- Static secret-pattern scan found no matches for common OpenAI, Paystack, AWS, JWT, MongoDB URI or private-key patterns in text source files. This is not a Git-history scan and does not prove there are no secrets.
- `npm audit` could not reach the npm registry because DNS/network access was unavailable. Dependency vulnerability status remains unverified.
- Production Vite builds and live browser/device tests were not run because dependencies were unavailable.

## Release gates before production deployment

1. Run `npm ci`, `npm audit` and builds in all four workspaces on a network-enabled machine.
2. Configure shared edge/WAF rate limiting.
3. Verify production environment variables and rotate any credential with uncertain exposure.
4. Test customer/vendor/admin ownership boundaries with separate accounts.
5. Verify data deletion requests end-to-end and complete lawful retention exceptions.
6. Confirm NDPC registration / DPO / audit obligations with counsel.
7. Sign provider DPAs and confirm cross-border transfer safeguards.
8. Complete the dependency and asset licence inventory.
9. Validate Google Analytics consent and third-party cookies in a clean browser.
10. Test voice capture and transcription on supported mobile browsers in all five languages.
11. Run an independent penetration test and restore test before describing the platform as production-secure.
