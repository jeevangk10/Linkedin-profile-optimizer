# LinkedIn Profile Optimizer

A production-style AI SaaS starter for analyzing and improving professional LinkedIn profile content.

## Stack

- Frontend: HTML, CSS, Vanilla JavaScript, Vite
- Backend: Node.js, Express
- Database: MySQL
- Authentication: JWT in HTTP-only cookie + bcrypt
- AI: configurable OpenAI-compatible HTTP API
- Resume parsing: PDF and DOCX
- No LinkedIn credentials or scraping

## Features

- Demo mode with fictional profile
- Multi-step profile editor
- AI analysis with structured JSON validation
- Heuristic profile score
- Headline generator
- About generator
- Experience optimizer
- Keyword optimizer
- Job-description match
- AI career assistant
- Profile history
- Register/login/logout
- MySQL persistence
- Resume extraction
- Rate limiting and server-side validation
- Responsive SaaS dashboard

## Setup

1. Install Node.js 20+ and MySQL 8+.
2. Create the database:
   ```sql
   CREATE DATABASE linkedin_optimizer CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
3. Run `database/schema.sql` against that database.
4. Copy `.env.example` to `.env` and configure the database/JWT values.
5. Install packages:
   ```bash
   npm install
   ```
6. Start development:
   ```bash
   npm run dev
   ```
7. Open `http://localhost:5173`.

## Public deployment (Render)

The included `render.yaml` configures the app as a single web service that builds the frontend and serves it from Express. The frontend uses same-origin `/api` requests in production; Vite proxies those requests to the local API during development.

1. Push this project to a GitHub repository, then create a Render Blueprint from that repository.
2. Create a MySQL 8 database with a provider that allows connections from Render. Apply `database/schema.sql` to it and set the service's `DATABASE_URL` to `mysql://USER:PASSWORD@HOST:PORT/linkedin_optimizer` (URL-encode special characters in the username or password).
3. Set `AI_API_KEY` to a Google AI Studio key if you want Gemini-powered analysis. Leave it empty to use the local heuristic analyzer.
4. Deploy the Blueprint. Render provides the public URL after the service passes `/api/health`.

Do not commit `.env` or paste database/API credentials into source files. Use the hosting provider's environment-variable settings for secrets. The free web service may sleep when idle.

## AI configuration

Set `AI_API_KEY`, `AI_BASE_URL`, and `AI_MODEL` for the same OpenAI-compatible provider. The key must be accepted as a Bearer token by the configured `/chat/completions` endpoint, and the model must support JSON response formatting. If no key is configured, the app uses a deterministic local demo analysis so the UI remains usable. Provider authentication, model, quota, and connection errors are shown in the app so configuration problems can be diagnosed.

For Google Gemini's OpenAI-compatible endpoint, use `https://generativelanguage.googleapis.com/v1beta/openai/` as `AI_BASE_URL`, a compatible Gemini model as `AI_MODEL`, and a Google AI Studio key as `AI_API_KEY`.

## Production notes

- Use HTTPS.
- Put the frontend and API behind the same trusted domain or configure `FRONTEND_URL`.
- Replace the default JWT secret.
- Add object storage for production resume uploads if needed.
- Add CSRF protection if authentication is expanded beyond same-site cookies.
- Review retention and deletion policies before storing real profile data.
