# Content Pillars — ChatGPT analytics setup

## Important limitation
A new ordinary ChatGPT chat does not automatically gain a live Cloudflare connection. This package adds a protected GET `/api/analytics` endpoint so a compatible custom connector or app action can retrieve current aggregate metrics. ChatGPT Plus personal accounts may not be able to create new custom GPTs/actions. This project has not been deployed and there is no active integration in ChatGPT yet.

## Deploy and protect the feed
1. Deploy this entire project to Cloudflare Pages, with the `DB` D1 binding and `schema.sql` applied.
2. Create a long unique random secret, e.g. `python -c "import secrets; print(secrets.token_urlsafe(48))"`. Do not send this secret in chat.
3. Set `ANALYTICS_API_TOKEN` as a production secret in Cloudflare Pages and redeploy.
4. Test the authenticated endpoint privately:
   `curl -H "Authorization: Bearer YOUR_PRIVATE_TOKEN" "https://YOUR-PROJECT.pages.dev/api/analytics?days=7"`
5. Test without the token. It should return HTTP 401. Keep the admin password separate from this token.
6. If your ChatGPT workspace supports creating API actions or custom apps, use `analytics-openapi.yaml`, replacing `YOUR-PROJECT` with the actual deployed project hostname. Configure the authentication credential only in the secure connection settings. Never paste the token into a conversation.

## The separate ChatGPT conversation
Start a new ChatGPT chat named **Nistha's Content Pillars — Analytics** and use this instruction:

> Be my Content Pillars analytics assistant. On each "Refresh dashboard" request, retrieve the latest analytics from the configured secure Content Pillars data source. Display the time data was fetched, period in days, consenting sessions, reports generated, document sends, email CTA clicks, newsletter opt-ins, top industries, countries, devices and a short change summary. Never fabricate numbers. Distinguish consenting session data from total report submissions. Don't display personal contact data.

Until a supported connection is available, download `/admin.csv` and `/admin-feedback.csv` (privately) and upload them to the chat whenever you want an updated dashboard. Uploads are manual snapshots, not automatic refreshes. The live browser dashboard remains at `/admin`.

## Privacy
The endpoint intentionally contains no raw visitor identity, email, IP, or newsletter contact information. It uses the consent-aware visit dataset for session data, but report and preference aggregates count application submissions independently of analytics consent. Data freshness is at request time. The data is limited to the most recent 10,000 rows per source and at most 90 days, so unusually high-volume activity may be truncated.
