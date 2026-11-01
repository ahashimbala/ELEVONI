# Elevoni Vendor Portal — Mobile App

The vendor portal is now configured as an installable Progressive Web App (PWA). On Android, open the deployed vendor portal in Chrome and choose **Install app** from the browser menu. On iPhone, open it in Safari, choose **Share → Add to Home Screen**.

On phone-sized screens (560px and below), the desktop top navigation is hidden and replaced with a fixed bottom navigation for Home, Sales, Apply and Account. Desktop navigation remains at the top.

The service worker caches the app shell and same-origin built assets only. It deliberately does not cache API, authentication, account, order or other private responses. An internet connection is still required for live vendor data and account actions.

This PWA is a separate installable vendor experience from the customer-facing Elevoni app. It does not yet create a separately signed native Android APK; that would require a separate Capacitor Android project and Android signing configuration.
