# Native splash and status-bar implementation status

## Android

Both Android projects are present and use the same approved customer splash artwork (`frontend/public/splash-screen.png`; the vendor copy is byte-identical). The dominant sage background is `#A2A288`. Android base and Android 12+ launch themes use that sage background and set the status bar to `#FFFFFF` with light-status-bar mode enabled (dark status-bar icons). The post-splash app themes retain the white status bar. Native splash drawables were regenerated from the approved artwork using contain/letterbox scaling so the artwork is not stretched.

Android 12+ applies the platform system-splash icon mask and cannot display an unrestricted full-screen 9:16 image in the same way as a custom iOS launch storyboard. Final appearance must be checked on Android 12+ devices/emulators.

## iOS

No `ios/` project, Xcode project, `LaunchScreen.storyboard`, or iOS asset catalog was present in the supplied archive for either app. No iOS launch-screen files were fabricated. To complete the iOS half, add/sync the Capacitor iOS platform in an environment with Xcode, then use the approved splash artwork and `#A2A288` in each app's LaunchScreen asset/storyboard, and configure a white status-bar/safe-area region with dark status-bar content. Verify on an iOS simulator/device.

## Web

No branded splash overlay or startup animation was found in the source files of the customer, vendor, or admin web apps. The static splash image assets remain available for native/PWA asset pipelines; no browser overlay was added.
