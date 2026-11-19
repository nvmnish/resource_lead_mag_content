# Nistha’s Content Pillars

Cloudflare Pages + Pages Functions + D1. No Flask server needed. All content research prompts remain in the private source/backend, not the public assets. The landing portrait is supplied by Nistha. The email button opens a draft in the visitor’s email client; newsletter consent defaults to No, and no subscriptions or messages are sent automatically.

## Deployment via a private GitHub repository
1. Create a private repository named `nisthas-content-pillars` at https://github.com/new (initialize with no README if pushing via git). Extract this archive; upload all files from the project root, including the `functions` and `public` directories, or push using Git:
   ```sh
   git init -b main
   git add .
   git commit -m "Initial Cloudflare Pages application"
   git remote add origin https://github.com/YOUR_USERNAME/nisthas-content-pillars.git
   git push -u origin main
   ```
2. Cloudflare Dashboard → Workers & Pages → Create → Pages → Connect to Git. Authorize the specific private repo. Select `main`, no framework, build command `exit 0`, output directory `public`, root directory blank. Do not upload only `public` or use dashboard drag-and-drop; the backend requires Pages Functions.
3. Create a D1 database named `content-pillars-db` under Storage & databases → D1. Run the contents of `schema.sql` in its SQL console (or run `npx wrangler d1 execute content-pillars-db --remote --file=./schema.sql` after authenticating Wrangler).
4. In the Pages project settings → Bindings, add a D1 database binding named `DB` and select that database. In Variables and Secrets add:
   - `OPENAI_API_KEY` (secret, API billing separate from ChatGPT)
   - `ADMIN_PASSWORD` (secret, strong random password)
   - `OPENAI_MODEL` (optional; default gpt-4.1, must support web search and structured output)
   - `DAILY_RESEARCH_LIMIT` (optional; default 20 research attempts per day across the app)
   - `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` (secret; for Google export)
   Redeploy after changes. Avoid committing secrets or OAuth tokens to GitHub.
5. Google Cloud Console: enable Google Docs API; configure OAuth consent and create a Web application OAuth client. Add `https://YOUR-PROJECT.pages.dev/oauth/callback` as an authorized redirect URI (also register the exact custom-domain callback if used). Configure test users while OAuth is in testing; complete Google’s applicable publishing requirements before offering public export. The requested scope is `drive.file`. Visitors authorize their own Google account; the document is created there. If the API or consent is not configured, research still works, but export does not.

## Private analytics
Visit `https://YOUR-PROJECT.pages.dev/admin` and sign in with username `admin` and your `ADMIN_PASSWORD`. `/admin.csv` exports the recorded sessions. Recommended: add Cloudflare Access protection to both routes for an additional authentication layer. The database holds consenting visits only; name/email is self-reported, device class and approximate country are inferred, and visible-tab time is estimated through heartbeat events. Anonymous visitors cannot be identified. A click on Email Nistha is not proof that an email was sent. An export click is tracked separately from successful creation. No raw IP stored by the app. Analytics and research records remain in D1 until deleted; establish a retention schedule and privacy notice before public launch. Example cleanup: `DELETE FROM visits WHERE julianday(opened)<julianday('now','-90 days');` and similarly for reports/created. No data is added to an email marketing service.

## Verification
Run `npm run check` for JS syntax validation. Real OpenAI calls, Google OAuth, and Cloudflare deployment require credentials and have not been end-to-end tested. Before public launch test research, mobile layout, both newsletter choices, consent/no consent, CSV, OAuth export and a daily limit. Consider Cloudflare Turnstile and per-user limits to prevent abuse. The app is not yet deployed.

## Version 2: preferences and partial 
Run `schema.sql` again on an existing D1 database before deploying this version; it adds two tables without deleting existing data. The feedback checkboxes preserve selected ideas exactly and regenerate only the unchecked slots using the original source catalog. Each  consumes one daily research attempt. Google Docs exports the current report revision. Selections save automatically; newsletter Yes requires full name and email plus the Save newsletter preference button, while No is saved when explicitly selected or saved. These are separate from optional visitor analytics. The dashboard displays submitted business inputs, selected idea titles and latest newsletter preference. `/admin-feedback.csv` exports these records; protect this route with Cloudflare Access as well. No email service is connected and no newsletter is automatically sent. To honor withdrawal, use the latest preferences and delete old exports containing superseded data. Apply a retention schedule to feedback and preferences as well as reports (delete child records before removing reports). Email tracking tracks only the click, not actual sending.

## V5 — Separate results and email delivery
The landing form navigates to `/results.html`, where a rotating activity indicator is shown while the actual research request runs. The activity labels are illustrative rather than server progress telemetry. Results can be restored in the same browser tab using the report ID and owner cookie. The contact panel is above the ideas, and email delivery is at the bottom.

Apply `schema.sql` again to create the deliveries table. For automatic Google Docs delivery configure the secret `GOOGLE_OWNER_REFRESH_TOKEN` in addition to `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`. Obtain a refresh token for your own authorized Google account with offline access and the `https://www.googleapis.com/auth/drive.file` scope (Google OAuth authorization code flow; never commit the token). Enable Google Docs and Drive APIs. The document is created in the authorized owner's Drive and shared privately with the submitted recipient using Google Drive's notification email. No separate email provider is required. Google account or Workspace sharing restrictions may apply. A separate self-service Google OAuth export remains available. Delivery email and status are recorded in the admin feedback CSV; delivery does not opt users into marketing. One delivery attempt per report is allowed to prevent abuse; failed attempts need admin review. Test on a staging deployment before going public.

### Short loading screen
The dedicated splash on `/results.html` is shown for no more than **1.5 seconds**. If external research is still running, the page switches to a small inline progress panel. It displays real ideas only after the research API completes. This does **not** force the underlying research or  API to complete within 1.5 seconds.

## V9 change — six ideas without selection or regeneration
The results page displays the six researched content ideas directly. Favourite selection, regeneration controls, and the associated endpoints have been removed. Newsletter preferences, email contact, Google Docs delivery, and analytics remain available. Existing deployed databases can retain the unused historical `feedback` table; new deployments do not need it.


## Private ChatGPT analytics integration (V10)

The project now exposes a read-only `/api/analytics?days=7` JSON endpoint protected by a dedicated `ANALYTICS_API_TOKEN` secret. This does not expose names, emails or IPs. Configure it in Cloudflare Pages secrets and redeploy. See `CHATGPT_DASHBOARD_SETUP.md` and `analytics-openapi.yaml`. The existing `/admin` page continues working. A new personal ChatGPT chat cannot automatically connect or refresh without supported integration or manually uploaded CSV exports.
