# GLP Competitor Dashboard

[![Live dashboard](https://img.shields.io/badge/live-dashboard-1f6feb?style=flat-square)](https://vishnunambiar-ui.github.io/glp-competitor-dashboard/)

Static competitor dashboard for public App Store and Google Play signals across Shotsy, Pep, MeAgain, and GlucoPal.

## Files

- `competitor_reviews.xlsx`: source workbook with exported reviews
- `scripts/build_data.py`: converts the workbook into `data/dashboard_data.json`
- `index.html`: static dashboard entrypoint
- `styles.css`: dashboard styling
- `app.js`: client-side rendering and filtering

## Refresh the data

```bash
cd "/Users/hme/Analytics/GLP competitor dashboard"
python3 scripts/build_data.py
```

## Preview locally

```bash
cd "/Users/hme/Analytics/GLP competitor dashboard"
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Publish on GitHub Pages

1. Create a new GitHub repository and push this folder.
2. In GitHub, open `Settings -> Pages`.
3. Set the source to deploy from the main branch root.
4. Wait for GitHub Pages to publish the site.

## Notes

- Apple does not expose public download counts.
- Google Play exposes install bands, not exact download counts.
- Public review exports can be lower than total historical review counts shown in the stores.
