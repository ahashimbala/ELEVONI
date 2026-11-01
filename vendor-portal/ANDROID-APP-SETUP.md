# Elevoni Vendor Android App

This is a separate Capacitor Android application with application ID `com.elevoni.vendor`, independent from the customer app (`com.elevoni.farms`). It packages the vendor portal web build and uses the vendor portal mobile bottom navigation.

## Build on a machine with Android Studio, Android SDK and JDK 21+

1. From `vendor-portal`, run `npm ci`.
2. Run `npm run build`.
3. Run `npx cap sync android`.
4. Open `vendor-portal/android` in Android Studio or run `cd android; .\gradlew.bat assembleDebug` on Windows.
5. For release distribution, configure a private signing key and release signing in Gradle; never commit keystore files or passwords.

The vendor app is a separate native shell. The vendor portal must be deployed to its own origin/path with API CORS and authentication configuration allowing that origin. Do not store API secrets in the frontend.
