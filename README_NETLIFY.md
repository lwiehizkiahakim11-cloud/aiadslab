# Netlify + Hermes Agent

## Deploy
1. Push the project folder to a GitHub repository.
2. Import that repository into Netlify. `netlify.toml` publishes this folder and deploys `netlify/functions/ai.mjs`.
3. Add the Hermes environment variables from `.env.example` in Netlify.
4. Redeploy, then open Settings and use **Test koneksi Hermes**.
5. Import a CSV and run Smart Analysis.

## Required variables
- `HERMES_API_URL`: HTTPS base URL of your reachable Hermes API server, typically ending in `/v1`.
- `HERMES_API_KEY`: must match Hermes `API_SERVER_KEY`.
- `HERMES_MODEL`: defaults to `hermes-agent`.
- `HERMES_TIMEOUT_MS`: default 50000, capped below the standard synchronous Netlify Function timeout.
- `SITE_ORIGIN`: exact deployed AdsPilot origin (recommended in production).

No Gemini API key is used by this project.

## Important deployment architecture
The website's `/api/ai` Netlify Function is only a proxy. Hermes must be running on a separate machine/service reachable over HTTPS. Do not set the URL to localhost for a hosted Netlify site. Keep Hermes behind an authenticated HTTPS reverse proxy; do not expose the Hermes port directly to the public internet.

The Hermes API server exposes the agent's tools. For a public SaaS, use a dedicated restricted profile/instance and disable risky toolsets not needed for text analysis. Add real user authentication, per-user authorization, tenant isolation, rate limits/quotas, monitoring, and audit logs before opening the app to customers.

CSV parsing remains in the browser. Only the normalized payload is sent when a user invokes Smart Analysis, Campaign Studio AI, or Creative Lab. Imported rows currently remain in that browser's localStorage and are not automatically shared between devices/users.

See `docs/HERMES_SETUP_ID.md` for Indonesian setup instructions.
