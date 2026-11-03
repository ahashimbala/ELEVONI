# Native splash and status-bar implementation status

## Android

Both Android projects are present and use artwork composed from the clean master `frontend/assets/splash.png` (1080 × 1920, flat `#A2A288`, no texture bands). Native portrait and landscape drawables were regenerated for both apps, and the shared transparent `splash_icon.png` is used for the Android 12+ system splash. The pre-launch bitmap is centred rather than stretched. Android base and Android 12+ launch themes use the sage background and set the status bar to `#FFFFFF` with light-status-bar mode enabled (dark status-bar icons). The post-splash app themes retain the white status bar.

Android 12+ applies the platform system-splash icon mask and cannot display an unrestricted full-screen 9:16 image in the same way as a custom iOS launch storyboard. Final appearance must be checked on Android 12+ devices/emulators.

## iOS

No `ios/` project, Xcode project, `LaunchScreen.storyboard`, or iOS asset catalog was present in the supplied archive for either app. No native iOS launch-screen files were fabricated. To complete the native iOS half, add/sync the Capacitor iOS platform in an environment with Xcode, then use the clean splash artwork and `#A2A288` in each app's LaunchScreen asset/storyboard, and configure a white status-bar/safe-area region with dark status-bar content. Verify on an iOS simulator/device.

## Web and installed PWA

No branded DOM overlay or startup animation was added. The customer and vendor manifests keep the sage `background_color` and regenerated icons, and both `index.html` files declare 26 portrait/landscape `apple-touch-startup-image` sizes for home-screen iPhone/iPad launching. These startup images are best-effort PWA launch artwork; they do not create or replace a native iOS launch storyboard. Android installed-PWA launch appearance remains browser/OS-controlled.
