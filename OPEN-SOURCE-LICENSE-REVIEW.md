# Open-source and asset licensing review

The supplied archive includes package manifests and lockfiles for the frontend, backend, admin and vendor portal. A complete licence conclusion cannot be made from package names and lockfiles alone, and the npm registry was unreachable during this review.

## Required review
1. Generate a production dependency licence report for all four workspaces.
2. Review every direct and transitive dependency licence and required attribution.
3. Review mobile Capacitor/Android dependencies separately.
4. Review fonts, icons, stock photos, generated images, video, maps and all other media for ownership and commercial-use rights.
5. Review the Dynamic ASR model and code licences separately; model-weight licences may differ from code licences.
6. Preserve all required `LICENSE`, `NOTICE` and attribution files in distributions.
7. Record approval for copyleft or source-disclosure obligations before shipping.

Suggested commands from each workspace:
```powershell
npx license-checker --production --summary
npx license-checker --production --csv --out THIRD-PARTY-LICENSES.csv
```

This document is a review checklist, not a statement that all licences have been cleared.
