# AdsPilot AI Workspace — Hermes + CSV

A lightweight Indonesian e-commerce ads workspace with manual CSV imports, profit calculations, campaign blueprints, and AI brainstorming/analysis via Hermes Agent.

## Run locally
- Requires Node.js 22.12+ for checks and Netlify CLI for local Functions.
- Copy `.env.example` values into your Netlify environment configuration (do not commit real secrets).
- The web app calls `/api/ai`; the Netlify Function proxies to a reachable HTTPS Hermes API server.
- See `docs/HERMES_SETUP_ID.md` for setup and troubleshooting.

## Required Netlify environment variables
`HERMES_API_URL`, `HERMES_API_KEY`, `HERMES_MODEL`; optionally `HERMES_TIMEOUT_MS` and `SITE_ORIGIN`.

This project does not use Gemini API and does not connect live to Meta/TikTok. Ads performance data is imported through CSV. Before using as a public SaaS, add authentication, tenant isolation, rate limits/quotas, and a restricted Hermes instance/profile; the Hermes API Server can expose privileged tools.
