# Elevoni consolidated implementation notes

## Included

- The active marketplace supports aquaculture and fisheries, livestock, and Food Crops. Food Crops includes Grains & Cereals, Vegetables & Fruits, and Tubers & Starch. The shared category contract uses the persisted Product.category values and is consumed by backend validation, vendor listings, customer marketplace filters, admin moderation and N-ATLaS listing drafts.
- Smoked catfish remains connected to the existing catalogue and cart/checkout flow.
- Livestock subcategories (poultry, cattle, sheep, goats) and Food Crops subcategories are filterable in the marketplace. Empty inventory is represented honestly; no sample listings were added.
- Historical `Smoked Catfish` subcategory records remain schema-valid and editable, but that legacy value is not offered as a new marketplace subcategory.
- Vendor product records support ordered image/video media entries while retaining the legacy `images` array for compatibility.
- Approved vendors can upload multiple product images/videos through the vendor portal, preview them, choose a primary image, reorder and remove media, and see upload progress/errors.
- Marketplace product details can display media galleries, swipe on touch screens, vendor business name/location/description, and the approved vendor application status. Public vendor responses omit contact names and contact channels.
- Marketplace product detail pages remain enquiry-based. The existing checkout/Paystack flow remains for Elevoni's smoked-catfish catalogue; livestock listings are not represented as paid orders until a separate fulfilment/payment process is approved and implemented.
- Password visibility toggles were added to the customer login, vendor application, vendor login/application, and admin login password fields.
- Vendor application form validation includes field-level errors and a linked error summary to help users find and correct invalid fields.

## Required deployment configuration

### Vendor image/video uploads

Set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` in the backend hosting environment. Uploads will return a configuration error until these are set. Images are limited to 10 MB each; videos are limited to 50 MB each; a listing supports up to 10 media items.

### Password recovery email

Set `RESEND_API_KEY`, `PASSWORD_RESET_FROM` (verified sender), and `FRONTEND_URL` in the backend hosting environment. Without these values, the recovery endpoint returns a service-unavailable response rather than pretending an email was sent. See `PASSWORD_RECOVERY_SETUP.md`.

## Verification performed in this repair environment

- Shared taxonomy, category adapter, shared product-category contract, N-ATLaS draft validation, timing logger, timeout hierarchy, client-abort, malformed-JSON and sales-summary tests: passed.
- Storefront pure JavaScript tests: passed (55 tests).
- Admin pure JavaScript tests: passed (27 tests).
- Combined dependency-free backend, shared, storefront and admin tests: passed (156 tests, 0 failures).
- Backend JavaScript/ES module syntax checks: passed.
- JSX/TSX syntax parsing: passed (60 files).
- Relative local import resolution: passed (446 imports checked).
- Full backend test suite could not be completed because dependencies such as Mongoose, Express, Cloudinary and the N-ATLaS SDK were absent. `npm ci` could not complete because this environment cannot resolve `registry.npmjs.org`.
- Vendor portal and storefront production builds could not be run because Vite is not installed in this environment. The vendor portal package currently has no `test` script or checked-in vendor-portal test suite.
- Admin full test suite is blocked by the missing Axios dependency; its dependency-free test files passed.
- Live MongoDB, private Modal inference, audio transcription and browser recording require the user's configured local environment and authorized private gateway. They have not been claimed as tested here.

## Operational follow-up

1. Configure the Cloudinary and Resend environment variables on the backend host.
2. Install dependencies in each app and run its build/lint/test scripts.
3. Test uploads with representative image/video files, including invalid formats and oversize files.
4. Test password recovery for unknown email, expired/reused token, and successful password reset.
5. Test approved/unapproved vendor permissions against the deployed API.
6. Define and validate livestock order acceptance, payment timing, delivery responsibility, cancellations, and dispute handling before enabling a livestock cart/checkout.
