# CSV First — Quick Setup

1. Export ad-report CSV manually from Meta Ads Manager or TikTok Ads Manager.
2. Open Performance Hub → Import Data, select the platform, and upload the CSV.
3. Review normalized campaign rows in Campaign History.
4. Open Smart Analysis and click **Analisis dengan Hermes**.

The website sends the normalized data summary to Hermes only after the user requests an AI action. This is manual CSV import, not live platform sync. Configure Hermes via `HERMES_API_URL` and `HERMES_API_KEY` in Netlify; see `docs/HERMES_SETUP_ID.md`.
