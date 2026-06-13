# AI Setter Agent for Scrapely

## What This Project Is

This is an AI-powered sales assistant that runs 24/7 and automatically replies to Twitter DM leads through Scrapely. When a lead responds to an outbound DM, this agent generates a natural, human-like reply using Claude AI and sends it back — with the goal of booking a sales call.

It also follows up automatically if leads go quiet (day 2 and day 7).

## Project Structure

```
src/server.js        — The main server. Receives webhooks, processes messages, sends replies.
src/claude.js        — Handles communication with the Claude AI API (with retries).
src/instructions.md  — PERSONALITY FILE. Controls how the AI talks (tone, style, flow).
src/offer.md         — CONTEXT FILE. Your product, results, testimonials, pricing info.
.env                 — YOUR API KEYS GO HERE. Never commit this file.
.env.example         — Template showing what keys you need.
```

## How to Help the User Set This Up

When someone asks for help setting this up, walk them through these steps in order. Ask them questions to fill things in — don't expect them to know what an API key is.

### Step 1: Install dependencies

Run `npm install` in the project root.

### Step 2: Create the .env file

Copy the example: `cp .env.example .env`

Then help them fill in each value:

**ANTHROPIC_API_KEY** — This is their Claude AI key.
- Ask: "Do you have an Anthropic account? If not, go to https://console.anthropic.com and sign up."
- They need to add a payment method (Settings > Billing), then create an API key (Settings > API Keys).
- The key starts with `sk-ant-`.

**SCRAPELY_API_KEY** — This is their Scrapely key.
- Ask: "Go to your Scrapely dashboard, then Settings > API. Copy the API key from there."

**CALENDAR_LINK** — Their booking link.
- Ask: "What's your calendar booking link? This is what gets sent to leads when pushing for a call. It's usually a Calendly, Cal.com, or similar link."

**WEBHOOK_SECRETS** — Required. This is how Scrapely authenticates webhook requests.
- Ask: "Go to your Scrapely dashboard → Settings → Global Webhook. When you add a webhook, Scrapely generates an X-Webhook-Key for you. Copy that value and paste it here."
- If they haven't added a webhook yet, walk them through it: Add Webhook → paste their server URL → click Generate to create a secret → copy the secret → paste it as WEBHOOK_SECRETS.

### Step 3: Customize the AI personality

**src/instructions.md** — This controls HOW the AI talks.
- The default is a casual, short, human-sounding SDR style. It works well for most use cases.
- Ask: "Do you want the AI to sound different? More professional? More casual? Or is the default style good?"
- If they want changes, edit the tone/style sections.
- Make sure any placeholder like `[YOUR PROPOSAL/CASE STUDY LINK]` and `[YOUR CALENDAR LINK]` gets replaced with their actual links.

**src/offer.md** — This controls WHAT the AI knows about their business.
- THIS FILE MUST BE FILLED IN. The AI can't sell if it doesn't know what it's selling.
- Show them `src/offer.example.md` as a reference for what a good offer file looks like.
- Ask these questions and fill in the file based on their answers:
  1. "What's your company name?"
  2. "What do you do / what do you sell? Explain it like you're telling a friend."
  3. "Do you have any results or testimonials from past clients? Even rough numbers work — like '12 calls booked in 2 weeks' is great."
  4. "What does your service include? What do clients get?"
  5. "How does the process work from their side? What happens after they book a call?"
  6. "What's the pricing range? The AI needs this so it can answer price questions without being evasive."
  7. "What's your website and email?"
- IMPORTANT: Write the offer in casual, conversational language — not corporate brochure style. The AI mirrors the tone of this file.
- Keep it under 1 page. The AI doesn't need a novel, just the key selling points.
- Make sure all placeholder text like "[Your Company Name]" is replaced. The AI will literally say those brackets out loud if you leave them in.

### Step 4: Test locally

Run `npm start` and confirm it starts without errors. They should see:

```
AI Setter Agent listening on port 9002
  Ready to receive Scrapely webhook events
```

If there are setup issues, the server will print them clearly at startup with numbered warnings (e.g. "ANTHROPIC_API_KEY is missing"). If the two required keys (ANTHROPIC_API_KEY and SCRAPELY_API_KEY) are missing, the server will refuse to start entirely.

Once it's running, visit `http://localhost:9002/health` in a browser. This shows the config status — which vars are set, which are missing, and whether offer.md still has placeholder text.

If there are errors, check:
- "Cannot find module" → Run `npm install`
- "❌ Cannot start" → Check `.env` file has ANTHROPIC_API_KEY and SCRAPELY_API_KEY filled in
- Port in use → Change `PORT` in `.env` to something else like `3000`

### Step 5: Deploy to Railway

1. They need a Railway account: https://railway.com (sign up with GitHub)
2. In Railway, click **"New Project"** → **"Deploy from GitHub Repo"**
3. Select their forked/cloned repo
4. Go to the **Variables** tab in Railway and add these (same values from their `.env`):
   - `ANTHROPIC_API_KEY`
   - `SCRAPELY_API_KEY`
   - `CALENDAR_LINK`
5. Railway auto-deploys. No need to set the port — Railway handles it.
6. Once deployed, go to **Settings > Networking > Public Networking** and generate a public URL.
7. Copy that URL — they'll need it for the next step.

### Step 6: Connect the webhook in Scrapely and finish Railway setup

This has to be done in this order:

1. Go to Scrapely dashboard → Settings → Global Webhook
2. Click "Add Webhook" and paste their Railway public URL (just the root URL, e.g. `https://something.up.railway.app`)
3. Scrapely will auto-generate an `X-Webhook-Key` secret (or they can click Generate)
4. **Copy that secret value**
5. Go BACK to Railway → Variables tab → add `WEBHOOK_SECRETS` and paste the secret they just copied
6. Railway will redeploy automatically with the new variable
7. Back in Scrapely, turn on "Enable Webhook Notifications" and "Send Webhook for All Replies"
8. Click Save Settings

The order matters because they need the Railway URL first (to put in Scrapely), and then the webhook secret from Scrapely (to put back in Railway).

### Step 7: Verify it works

- Go to `https://their-railway-url.com/health` in a browser. It should show `{"status":"ok"}`.
- Send a test DM through Scrapely to see if the AI responds.

## Common Issues and Fixes

- **Server won't start** → It prints exactly what's missing. The two required env vars are ANTHROPIC_API_KEY and SCRAPELY_API_KEY.
- **Visit /health to debug** → This endpoint shows which env vars are set, which are missing, and whether offer.md still has placeholder text. Always check this first.
- **AI replies sound generic or wrong** → The user needs to fill in `src/offer.md` with their real business info. Show them `src/offer.example.md` as a reference. The AI is only as good as the context it gets.
- **No replies being sent** → Check: (1) Scrapely API key is correct, (2) webhook URL in Scrapely points to the server URL, (3) WEBHOOK_SECRETS matches the X-Webhook-Key in Scrapely Settings, (4) "Enable Webhook Notifications" and "Send Webhook for All Replies" are turned on.
- **Getting 403 Forbidden** → The WEBHOOK_SECRETS env var doesn't match the X-Webhook-Key in Scrapely. Copy the exact value.
- **"AI setter disabled" in logs** → The conversation has `ai_setter_enabled: false` in Scrapely CRM. Enable it there.
- **Railway deploy fails** → Make sure `package.json` is in the root. Check Railway's "Deploy Logs" tab for the exact error.
- **Railway: no webhooks arriving** → Make sure Public Networking is enabled (Railway > Settings > Networking) and the public URL is set as the webhook in Scrapely.
- **Rate limits from Claude** → The agent has built-in retries and falls back to a smaller model. If it keeps failing, check the Anthropic billing dashboard to make sure there's credit.

## Technical Notes

- The server is plain Node.js (no Express). It uses the built-in `http` module.
- Claude API calls are in `src/claude.js` with automatic retry (tries Opus first, falls back to Haiku).
- Follow-up timing is controlled by `FOLLOWUP_CHAIN` in `src/server.js` — default is day 2 and day 7.
- The agent adds a 5-15 second random delay before replying to seem human.
- It won't send more than 3 messages in a row without a lead response.
- All secrets come from environment variables. Nothing is hardcoded.

## Commands

```
npm install    — Install dependencies
npm start      — Start the server
npm run dev    — Start with auto-restart on file changes (for development)
```
