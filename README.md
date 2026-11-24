# detent-site

Public pages for the iOS app Detent: the landing page, a features page, the
privacy policy and the support page. Served by GitHub Pages from the `main`
branch root.

- `index.html` — landing page
- `features.html` — every feature on the real app screens
- `assets/` — styles and scripts shared by the two pages above (live phones,
  step-by-step scrolling, feature demos)
- `img/` — app screens, the icon and the link preview image (`og.png`)
- `privacy.html` — privacy policy (App Store Connect › App Privacy › Privacy Policy URL)
- `support.html` — support page (App Store Connect › version › Support URL)
- `style.css` — styles for the privacy and support pages

Since 2026-11-24 both main pages show Apple's "Pre-order on the App Store"
badge with the date next to it. On release day, 2026-12-01, swap it for the
"Download on the App Store" badge (same link to the App Store page).

The app's code lives in a separate, private, local-only repository. Keep the
privacy policy true to what the app does: if Detent ever starts collecting
data, change this page before the app ships it.
