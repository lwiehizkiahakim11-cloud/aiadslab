# AdsPilot AI v2 — Hermes Agent + CSV + Netlify

AdsPilot AI menggabungkan empat area kerja: Overview, Campaign Studio, Performance Hub, dan Profit Planner. Smart Analysis, strategi campaign, serta Creative Lab kini diarahkan ke Hermes Agent melalui Netlify Function. Project ini tidak memakai Gemini API.

## File penting
- `index.html`, `styles.css`, `app.js`: UI responsive dan interaktif.
- `netlify/functions/ai.mjs`: proxy server-side dari website ke Hermes OpenAI-compatible API.
- `netlify.toml`: mapping `/api/ai` ke Netlify Function.
- `.env.example`: daftar environment variables untuk Netlify.
- `docs/HERMES_SETUP_ID.md`: petunjuk lengkap menghubungkan Hermes.
- `docs/HERMES_PROMPT.md`: kontrak output JSON dan prinsip keamanan AI.
- `templates/`: template CSV Meta, TikTok, dan format standar.
- `reference/`: dua kalkulator HTML seller yang diberikan sebelumnya.

## Mulai cepat
1. Deploy folder ini melalui repository GitHub ke Netlify.
2. Jalankan Hermes pada server/host yang selalu aktif dan publikasikan API server melalui HTTPS reverse proxy yang diautentikasi.
3. Di Netlify → Site configuration → Environment variables, isi `HERMES_API_URL`, `HERMES_API_KEY`, `HERMES_MODEL`, dan `SITE_ORIGIN`. Lihat `.env.example`.
4. Redeploy.
5. Buka **Settings → Test koneksi Hermes**.
6. Impor CSV di Performance Hub dan jalankan **Analisis dengan Hermes**.

Detail langkah dan troubleshooting ada di `docs/HERMES_SETUP_ID.md`.

## Cara kerja Smart AI
Netlify Function membuat permintaan ke `HERMES_API_URL/v1/chat/completions` (atau endpoint yang sesuai). Token hanya tersedia di server. Output dinormalisasi menjadi JSON yang dipakai untuk analisis, strategi, setup campaign, dan creative. CSV mentah tetap berada di browser; hanya payload ringkasan yang diperlukan dikirim setelah pengguna menekan tombol AI.

## Batasan dan keamanan
- Hermes mesti berjalan online dan memiliki model/provider terkonfigurasi; URL localhost komputer pribadi tidak bisa diakses oleh Netlify.
- Fitur CSV adalah impor manual, bukan sinkronisasi langsung akun ads.
- Setup Meta/TikTok merupakan blueprint untuk diterapkan manual, bukan publish campaign live.
- Hermes API Server memiliki toolset yang kuat. Untuk SaaS publik, gunakan instance khusus yang sudah dibatasi, jangan mengekspos port mentah atau token di browser, serta tambahkan login, tenant isolation, rate limiting, kuota, monitoring, dan audit log.
- Ini masih project starter, bukan SaaS multi-tenant production.
- Matikan/abaikan `GEMINI_API_KEY` dan `GEMINI_MODEL` karena project ini menggunakan Hermes.

## Deploy Hermes ke Hostinger KVM

Lihat `deploy/hostinger/README_HOSTINGER_ID.md`. Script `install-hostinger-hermes.sh` menyiapkan Hermes Agent, service systemd, Caddy HTTPS, token API, serta pengaturan environment Netlify. Script belum dapat dieksekusi dari dalam chat; jalankan sendiri pada VPS melalui SSH setelah DNS subdomain diarahkan ke IP VPS.
