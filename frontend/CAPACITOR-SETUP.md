# Elevoni Farms — Capacitor Android and iOS packaging

## Splash artwork

The clean splash master is `assets/splash.png` (1080 × 1920, flat sage `#A2A288`, no texture bands). Android portrait/landscape splash drawables and installed-PWA icons/startup images are generated from this master plus the transparent Android emblem. Do not use the older banded `splash-screen.png` copies for new compositions. The splash screen is a brief launch screen; it is not a replacement for the React home page. Android 12 and later may display a system-controlled splash treatment, so the exact full-image composition can vary by OS version.

## Requirements

- A supported Node.js LTS release and npm.
- Android: Android Studio, Android SDK, and a configured JDK (Java 21 is installed in the current build environment, but Android Studio/SDK are not).
- iOS: macOS and Xcode. iOS native projects cannot be built or signed on Windows/Linux.

## Generate Android project (run from `frontend/`)

```bash
npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/splash-screen
npm install -D @capacitor/assets
npx cap assets
npm run build
npx cap add android
npx cap sync android
npx cap open android
```

If `android/` already exists, skip `npx cap add android` and run `npx cap sync android` instead. In Android Studio, allow Gradle sync to finish, then run on an emulator or connected Android phone. The `com.elevoni.farms` application ID is a proposed identifier; confirm it before publishing because changing it later affects store identity.

## Generate iOS project (run from `frontend/` on a Mac)

```bash
npm install @capacitor/core @capacitor/cli @capacitor/ios @capacitor/splash-screen
npm install -D @capacitor/assets
npx cap assets
npm run build
npx cap add ios
npx cap sync ios
npx cap open ios
```

If `ios/` already exists, skip `npx cap add ios`. In Xcode, set the signing team and bundle identifier, then test on a real device before archiving. App Store submission also requires Apple developer account access and signing.

## Update after web changes

```bash
npm run build
npx cap sync
```

## Important limitations

- Android projects already exist in `frontend/android` and `vendor-portal/android`; the iOS project does not exist yet. Run the iOS commands on a Mac with Xcode.
- Dependency installation and native project generation require working npm access. Run `npx cap copy android` or `npx cap sync android` after rebuilding the web app so the APK does not retain an older bundle.
- Test account login, product browsing, ordering, Paystack checkout/verification, WhatsApp links, and deep links on devices. Live products, accounts, orders and payments require internet.
- Do not commit signing keys, `.env` files, or store credentials.

## Required sync after source or branding updates

The generated Android web bundle is intentionally not stored in the source archive. After installing dependencies and building the frontend, run `npx cap sync android` from this `frontend` directory before opening Android Studio or running Gradle. This ensures the APK contains the current website bundle, PWA manifest, icons and splash-related web assets rather than an older generated copy.
