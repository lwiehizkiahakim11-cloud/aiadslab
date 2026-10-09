# Changelog

## Hermes Agent integration
- Replaced Gemini endpoint implementation with a server-side Netlify proxy to Hermes' OpenAI-compatible `/v1/chat/completions` API.
- Added environment variables `HERMES_API_URL`, `HERMES_API_KEY`, `HERMES_MODEL`, `HERMES_TIMEOUT_MS`, and `SITE_ORIGIN`.
- Updated interface labels, status messaging, connection test, and setup errors to refer to Hermes.
- Added JSON parsing/normalization and clearer connection/auth/timeout errors.
- Added Indonesian Hermes setup and security documentation.
- Preserved CSV import, existing calculator logic, campaign planning, and creative generation features.
- Escaped AI and imported-text values before inserting them into HTML in key analysis/creative result views.

## Important
This changes the web app's AI provider to Hermes, but the user must still host/configure a reachable Hermes API server and a model provider. It is not connected until the Netlify environment variables are set correctly.

## Hostinger KVM
- Added guided installer for dedicated non-root Hermes service on Ubuntu/Debian VPS.
- Added HTTPS reverse proxy with endpoint allowlist using Caddy.
- Added Netlify environment-variable handoff and setup/troubleshooting guide.
- Disabled high-risk Hermes toolsets for the dedicated AdsPilot instance.
