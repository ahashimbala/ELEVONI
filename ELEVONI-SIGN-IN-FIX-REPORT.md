# Elevoni sign-in fix

## Root cause found
The storefront authentication form rendered a `required` terms-consent checkbox for both Sign Up and Login. When a returning customer did not check that box, browser-native form validation blocked the Login submit event. The request therefore never reached `/api/user/login`.

## Changes
- Terms consent is now required only when creating a new account. Returning customers can sign in without re-accepting the signup checkbox.
- Login submits only the email and password fields; signup submits name, email and password.
- Email whitespace is trimmed before submission; password content is preserved exactly.
- Added a pending state to prevent duplicate submissions and show progress on the button.
- Added a request timeout and clearer distinction between invalid credentials, timeout, network failure and backend validation errors.
- Added a disabled-button state while authentication is in progress.

## Files changed
- `frontend/src/components/LoginPopup/LoginPopup.jsx`
- `frontend/src/components/LoginPopup/LoginPopup.css`

## Verification
- Confirmed the form now renders the required consent checkbox only in Sign Up state.
- Confirmed Login payload contains only email and password and posts to `/api/user/login`.
- Confirmed Sign Up payload contains name, email and password and posts to `/api/user/register`.
- Backend controller and registration service passed `node --check`.
- Full frontend build and live sign-in against the deployed API were not run in this environment. No credentials or production configuration were available. This source fix does not itself deploy to Vercel.

## If login still fails after deploying this fix
Capture the browser Network entry for `POST /api/user/login` (status code and response message only; do not share the password, token, cookies or request payload). A `401` means the backend did not accept the email/password pair; a `403` points to CORS/origin configuration; a `404` indicates the deployed API route/version; a `5xx` indicates a backend/database/configuration failure.


## Follow-up: customer storefront popup positioning

The customer-reported browser measurements showed the popup at `y ≈ 3510px` in a `545px` viewport while the body was fixed for scroll locking. The popup was also computed as `position: static` despite the intended fixed overlay rule.

The follow-up patch makes the overlay a direct child of `document.documentElement` rather than `document.body`. The body can therefore remain fixed at its saved scroll offset without becoming the popup's ancestor. A narrowly scoped `#elevoni-login-popup.login-popup` rule explicitly enforces fixed viewport positioning and stacking. The scroll-lock effect now saves/restores both body positioning styles and the root overflow style, and restores the original horizontal and vertical scroll coordinates on close.

## Follow-up verification status

- Source-level checks: confirmed the portal target is `document.documentElement`, the popup has a unique ID matching the fixed-position CSS rule, and cleanup restores prior body/root styles and the original scroll coordinates.
- Full Vite build and live mobile-browser verification were not run because this uploaded archive is a source patch and does not include the full project or dependencies.
