# Elevoni UI and mobile polish update

## Included changes

- Hardened homepage/category anchor scrolling so returning to a homepage section from another route waits for the target section to mount.
- Added a route-resolution test covering every configured category and subcategory destination.
- Added Aquaculture & Fish Farming and Fisheries & Fish Products to the vendor portal application focus options.
- Captured Chromium's one-shot `beforeinstallprompt` event at frontend module startup and buffered it for the React install component, preventing the event from being lost before that component mounts.
- Improved Android install guidance and install-prompt error fallback.
- Added explicit PWA manifest IDs and aligned PWA theme/background colours to the reference sage `#A2A288`; added equivalent service-worker response headers for the vendor portal.
- Added the same approved startup artwork to the customer and vendor web app startup overlays and Android launch resources.
- Added a transparent emblem-only asset for Android 12+ system splash icon rendering, avoiding an extra rectangular icon tile around the artwork.
- Added full-screen 1080x1920 launch artwork for older Android launch windows and aligned launch-theme sage colours.

## Splash-screen platform note

Android 12 and newer enforce a system splash-screen layout: Android controls the icon's position, size and mask. The native launch screen therefore uses the approved emblem as a transparent splash icon over the exact sage background. The full static reference artwork is also shown as the first web-app startup overlay while the WebView finishes loading. Android 11 and older use the full-screen launch drawable.

## PWA installation note

A PWA is installed by the browser; it is not an APK file download. On supported Android Chrome versions, Elevoni should expose the native install prompt when the site is served over HTTPS, the manifest/icons are valid, and the service worker has activated. If Chrome does not expose the prompt, the page provides the browser's Add to Home screen instructions. Native APK installation remains a separate Android build workflow.

## Validation

- `frontend/tests/categories.test.js`: 18 tests passed using Node's test runner.
- Manifest JSON and Android XML validation are included in the handoff checks.
- Full Vite builds and Android Gradle builds were not run in this environment because dependencies were not installed; `npm ci` timed out. Run the build steps locally before deployment or APK installation.
