# Elevoni security, privacy, legal and SEO readiness

**Reviewed source archive:** `ELEVONI-SECURITY-LEGAL-SEO-REVIEW.zip`  
**Review date:** 9 November 2026  
**Entity named in the product notices:** Elevoni Agro Digital Solutions Ltd

This is an engineering implementation and readiness record, not a penetration-test certificate, legal opinion or representation that the company is fully compliant.

## Implemented in this update

- Added baseline API security response headers, disabled Express's `X-Powered-By`, configured one trusted proxy hop for the Vercel deployment, and reduced JSON / URL-encoded request body limits.
- Added process-local rate limits for registration, login, Google authentication, buying-requirement extraction and submission. Existing assistant-specific rate limits remain in place.
- Removed CORS error responses that echoed the rejected Origin value.
- Reduced the general media-upload size ceiling from 100 MB to 25 MB.
- Added opt-in Google Analytics consent. Analytics is not initialised until a user accepts; rejecting optional analytics leaves it disabled.
- Added Privacy Policy, Terms and Conditions, and Cookie Policy pages, footer links and a preference re-open control.\n- Added a public privacy-request intake form and an admin-only dashboard to track access, correction, deletion, restriction, portability and objection requests. Requests require identity verification; the dashboard deliberately does not auto-delete transactional records.
- Added a storefront-owned XML sitemap and corrected robots.txt to point to it.
- Added storefront metadata, canonical URL and Organization / WebSite JSON-LD.
- Added a microphone button beside the buying-requirement free-text box. It records only after the user taps it, sends the recording to the existing customer transcription endpoint, inserts the transcript into the box, and leaves the user to review and select Extract details. It does not submit the requirement automatically.
- Added baseline security headers to the frontend, admin and vendor Vercel configurations. Admin and vendor portals are marked `noindex`.

## Important limitations and production blockers

1. **Rate limiting:** the added limiter is process-local. Vercel/serverless functions can run multiple instances, so it is not a globally consistent abuse-control system. Configure a shared WAF / edge rate limit or Redis-backed limiter before relying on it for production abuse prevention.
2. **Security testing:** no authenticated penetration test, external vulnerability scan, production configuration review or live access-control test was possible in this source-only environment.
3. **Dependency audit:** `npm audit` could not reach the npm registry in this environment (DNS/network failure). The lockfiles are retained; run the commands below from a network-enabled environment.
4. **Git history:** the supplied ZIP contains no `.git` directory. Historical committed secrets cannot be scanned from this archive. Run the documented secret scan against the actual repository and rotate any exposed credential.
5. **Deletion:** the privacy-request form records requests and the admin dashboard tracks their status. This update does not automatically erase order, payment, vendor or legal records. A trained operator must verify requests, assess statutory retention exceptions and complete the deletion/anonymisation workflow across the relevant systems.
6. **Processor agreements:** no provider contract or DPA can be signed by a code change. Obtain and retain the required agreements and transfer safeguards with each active provider.
7. **Legal approval:** Privacy Policy and Terms are implementation drafts based on the inspected features. Have Nigerian counsel approve the company identity/contact, marketplace agency model, refunds/returns, consumer terms, retention periods and liability clauses before treating them as final legal documents.
8. **GDPR:** GDPR does not automatically apply merely because a Nigerian service is accessible from Europe. It may apply if Elevoni has an EU establishment or offers goods/services to people in the EU or monitors their behaviour there. Confirm actual targeting, customers and analytics configuration with counsel.
9. **NDPC status:** assess whether Elevoni is a Data Controller or Processor of Major Importance under the NDPA and GAID, whether registration, a DPO, DPIA or audit filing is required, and what category/threshold applies. This cannot be determined from source code alone.
10. **Cookie scope:** the storefront gates its Google Analytics initialisation behind consent. Re-check all deployed apps, embedded providers, Google sign-in and payment flows in a clean browser. Third-party pages may set their own cookies outside the storefront's control.
11. **SEO:** sitemap contains stable public pages only. Dynamic product URLs should be added through a controlled build-time or server-side sitemap once the canonical product URL inventory is available. Submit the storefront sitemap to Google Search Console and Bing Webmaster Tools.
12. **Voice entry:** browser microphone access requires HTTPS and explicit user permission. The browser/OS controls the permission choice. Audio is sent to the configured ASR provider; transcription quality and provider retention must be tested against each supported language.

## Nigerian data protection and legal operating checklist

- Confirm the legal controller name, registered address, privacy contact and complaint escalation contact.
- Map each data field to purpose, legal basis, recipient, retention and access owner.
- Keep supplier contact-sharing consent specific to each buyer requirement; do not reuse it as marketing consent.
- Do not send promotional messages unless a separate valid marketing permission/other lawful basis is established and an opt-out is honoured.
- Review the Admin → Privacy requests queue at least once each business day. Maintain a request log for access, correction, deletion, restriction, portability and objection requests. Verify identity before disclosing or changing records.
- Maintain a breach register. Escalate immediately to the privacy lead and counsel. Under NDPA section 40, qualifying breaches must be notified to NDPC within 72 hours of awareness; high-risk affected individuals must also be informed as required by law.
- Complete a DPIA before introducing high-risk processing, large-scale sensitive data, systematic monitoring or materially expanded AI profiling.
- Confirm international transfer safeguards for each processor and subprocessor outside Nigeria.
- Keep a signed processor register and data-processing agreements.
- Confirm whether the company requires NDPC registration and the appropriate compliance audit / DCPMI obligations.
- Ensure vendors are contractually responsible for listing accuracy, product legality, stock, quality, delivery and handling buyer information received through Elevoni.

## Security deployment checklist

- [ ] Set strong, unique production secrets for `JWT_SECRET`, `ASSISTANT_USAGE_HMAC_SECRET`, database and provider credentials.
- [ ] Rotate any key ever committed, pasted into logs, exposed in a ZIP or shared with an unauthorised person.
- [ ] Confirm `.env` files are absent from deployment artifacts and Git; retain only `.env.example`.
- [ ] Restrict MongoDB network access to required application sources; use a least-privilege database user and TLS.
- [ ] Enable Vercel deployment protection / account MFA and restrict team access.
- [ ] Configure shared edge rate limits for login, registration, assistant, transcription, upload and public forms.
- [ ] Review all API routes for user/owner scoping and admin/vendor role enforcement.
- [ ] Test object-level authorisation using two separate customer accounts and two vendor accounts.
- [ ] Verify Paystack webhook signature / transaction verification and idempotency.
- [ ] Confirm Cloudinary upload restrictions and media moderation.
- [ ] Run dependency audit and update vulnerable packages in controlled batches.
- [ ] Scan full Git history for secrets and rotate findings.
- [ ] Enable database backups and test restore.
- [ ] Configure monitoring and incident contacts; do not log passwords, tokens, full voice payloads or payment credentials.
- [ ] Run production smoke tests and an independent penetration test before claiming the platform is secure.

## Commands to run on a network-enabled machine

Run inside each application directory:

```powershell
npm ci
npm audit
npm audit --omit=dev
npm run lint
npm run build
```

For backend:

```powershell
npm ci
npm audit
npm audit --omit=dev
npm test
```

For secret history scanning in the actual Git repository:

```powershell
git log --all --oneline
gitleaks git --redact --verbose
```

If Gitleaks is not installed, install it from its official release source first. A clean ZIP scan is not a substitute for Git-history scanning.

## Open-source licence inventory

Lockfiles are retained for the four JavaScript workspaces: `frontend`, `vendor-portal`, `admin`, and `backend`. Generate and review a licence inventory from a network-enabled environment:

```powershell
npx license-checker --production --summary
npx license-checker --production --csv --out THIRD-PARTY-LICENSES.csv
```

Review transitive dependencies, attribution notices, copyleft obligations, mobile SDK licences, fonts, images, icons and model licences. Do not redistribute any asset unless Elevoni has the necessary rights. The Modal Dynamic ASR model has separate model-weight licensing conditions documented in `modal-asr/NOTICE.md`; obtain legal review before commercial use.

## Operational data retention proposal

Use the privacy notice's stated schedule as an operating target, then have counsel validate statutory periods:
- Accounts: active account lifetime; verified closure requests actioned within 30 days where lawful and technically feasible.
- Orders, payments, tax and accounting: retain for the legally required period; isolate from routine product analytics.
- Security logs: normally 90 days, longer only for an active investigation or legal hold.\n- Privacy request records: normally 2 years after closure, longer only where needed to demonstrate compliance or handle a dispute.
- Buyer requirements and enquiries: retain while needed to fulfil the request and resolve disputes, then delete/anonymise.
- Voice recordings: process transiently for transcription; do not retain as application account records unless a separately disclosed feature requires it.
- Analytics: collect only after optional analytics consent.

## Release decision

The code changes in this update are a **security and privacy baseline**, not a production security certification. Do not announce “fully secure”, “GDPR certified” or “NDPA compliant” until the outstanding company, provider, legal, operational and independent testing actions are complete.
