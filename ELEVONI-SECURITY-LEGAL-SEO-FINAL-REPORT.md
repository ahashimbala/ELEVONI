# Elevoni security, legal, privacy, SEO and voice-entry update

**Source used:** the uploaded `ELEVONI-SECURITY-LEGAL-SEO-REVIEW.zip`  
**Review date:** 9 November 2026  
**Scope:** customer storefront, admin portal, vendor portal, backend, shared files and supporting documentation.

## Implemented

### Security
- Added API security headers and disabled Express identification.
- Added proxy-aware client IP handling for Vercel.
- Reduced JSON and URL-encoded request body limits.
- Added process-local rate limits for API mutations, authentication, buying requirement interpretation/submission and privacy-request intake.
- Preserved server-side JWT, role and vendor-approval guards.
- Increased new customer password hash work factor to bcrypt cost 12 and bounded login/register password input length.
- Replaced multiple raw error-object logs with structured error metadata to reduce accidental secret leakage.
- Removed rejected CORS Origin echoing.
- Reduced generic media upload size ceiling to 25 MB.
- Added noindex handling for admin and vendor portals.
- Restricted Vite development host allowlists to localhost and loopback.
- Added security findings and production release-gate documentation.

### Privacy and legal
- Rewrote the Privacy Policy around the data fields and providers visible in the source.
- Added Terms and Conditions covering Elevoni Direct versus independent Marketplace listings, buyer requirements, vendor duties, payments, refunds, AI limitations and consumer-rights safeguards.
- Added a Cookie Policy and optional analytics consent banner.
- Google Analytics initialisation is gated until optional analytics consent; reject disables further analytics and attempts to clear GA cookies.
- Added public privacy-request intake and an admin-only queue to track access, correction, deletion, restriction, portability and objection requests.
- Added retention targets, legal-basis descriptions and third-party processor register.
- Added data breach playbook, IP ownership checklist and open-source licence review checklist.

### SEO
- Added a storefront sitemap and corrected `robots.txt` to point to the storefront sitemap.
- Added Organization and WebSite JSON-LD to the storefront HTML.
- Added canonical metadata to category, marketplace, privacy, terms and cookie pages.
- Improved product structured data so independent Marketplace enquiries are not incorrectly advertised as a direct purchasable Offer.
- Added social metadata to the storefront shell.
- Admin and vendor portal are marked noindex.

### Buying requirement voice entry
- Added a microphone control beside the free-text requirement box.
- Recording begins only after the user taps the microphone.
- Uses the existing `/api/assistant/customer/transcribe` endpoint and the selected language.
- Transcript is inserted into the box for review. The user must still select “Extract details” and submit manually.
- Added localized speak/stop/recording feedback for English, Nigerian Pidgin, Hausa, Igbo and Yoruba.

## Validation performed

- 8 focused backend tests passed: buyer-requirement and security-middleware tests.
- Full backend suite: 126 passed; 15 test files could not load because `node_modules` was absent (missing packages included Mongoose, Express, Cloudinary, jsonwebtoken and dotenv).
- All backend JavaScript files passed `node --check`.
- 96 frontend, admin and vendor JavaScript/JSX files passed TypeScript parser/transpilation checks.
- JSON configuration files and the XML sitemap parsed successfully.
- Text-source secret-pattern scan found no common OpenAI, Paystack, AWS, JWT, MongoDB URI or private-key pattern matches.
- No actual `.env`, private-key files, `.git`, `node_modules` or build-cache directories were included in the final ZIP.

## Not verified / still required

- `npm audit` could not contact the npm registry because network DNS resolution failed. Dependency vulnerability status is therefore not confirmed.
- Production Vite builds and Android/Capacitor builds were not run because dependencies were not installed and the npm registry was unreachable.
- No live browser/device test of microphone permission, transcription or native-language accuracy was run.
- No live Paystack, OpenAI, ElevenLabs, Modal, Cloudinary, Google OAuth or MongoDB integration test was run.
- No production environment variables, Vercel settings, MongoDB Atlas network rules, backups or restore process were accessible for inspection.
- No Git history was included; historical secret scanning remains outstanding.
- No independent penetration test was run.
- The rate limiter added in code is process-local. A shared WAF/edge or Redis-backed rate limiter is still required for reliable multi-instance/serverless enforcement.
- Privacy requests are tracked, but deletion is not automated. An authorised operator must verify identity, review statutory retention exceptions and carry out deletion/anonymisation across relevant systems.
- Provider DPAs and international-transfer safeguards must be reviewed and signed by the company; code cannot sign them.
- NDPC registration/DCPMI, DPO, DPIA and audit requirements must be assessed against Elevoni's actual processing scale and business status.
- GDPR applicability depends on EU establishment, targeting/offering services to people in the EU or monitoring behaviour there; accessibility from Europe alone does not establish applicability.
- Privacy Policy and Terms are product-specific drafts, not a legal opinion. Nigerian counsel must review and approve them before Elevoni represents itself as legally compliant.
- Dynamic product URLs are not in the static sitemap. Add them through a controlled generated sitemap once the canonical product URL source is confirmed.
- Rebuild and sync the Capacitor Android web assets after installing dependencies, before producing updated mobile binaries.

## Build and deployment status

The source changes and documentation are packaged. **Nothing has been deployed.** Run dependency installation, audits, full tests and builds in a network-enabled environment before deploying.
