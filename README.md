# AI Setter Agent for Scrapely

An AI-powered assistant that automatically replies to your Twitter DM leads through Scrapely. It reads incoming messages, generates human-like responses using Claude AI, and books calls for you — on autopilot.

## What it does

- **Auto-replies to leads** — When someone responds to your outbound DMs, the AI generates a natural, casual reply
- **Follows up automatically** — If a lead goes quiet, it sends follow-up nudges on day 2 and day 7
- **Books calls** — Drops your calendar link at the right moment to push leads toward a call
- **Matches their tone** — Short replies for short messages, casual when they're casual

## Setup Guide

### Step 1: Get your API keys

You need two keys before starting. Get these first:

**Claude API key** (powers the AI replies):
1. Go to [console.anthropic.com](https://console.anthropic.com) and sign up
2. Go to **Settings > Billing** and add a payment method — **the key won't work without this**
3. Go to **Settings > API Keys** and create a new key
4. Copy it — it starts with `sk-ant-`

**Scrapely API key** (connects to your Scrapely account):
1. Go to your Scrapely dashboard → **Settings** → scroll down to **API Keys**
2. Click **Create Key** and copy it

### Step 2: Fork this repo

Click the **"Use this template"** button (or **Fork**) at the top of this page. This creates your own copy on GitHub.

### Step 3: Customize what the AI says

Before deploying, you need to edit two files in your forked repo. You can do this directly on GitHub (click the file → pencil icon → edit → commit) or use Claude Code.

**`src/offer.md`** — Tell the AI what you're selling. **This is the most important file.** Replace the placeholder text with your real business info: what you do, your results, testimonials, pricing. See `src/offer.example.md` for a filled-in example.

**`src/instructions.md`** — How the AI talks. The default casual SDR style works for most people. Replace `[YOUR CALENDAR LINK]` and `[YOUR PROPOSAL/CASE STUDY LINK]` with your actual links.

### Step 4: Deploy to Railway

1. Go to [railway.com](https://railway.com) and sign up with your GitHub account
2. Click **"New Project"** → **"Deploy from GitHub Repo"**
3. Select your forked repo
4. Go to the **Variables** tab and add these four variables:
   - `ANTHROPIC_API_KEY` — your Claude key from Step 1
   - `SCRAPELY_API_KEY` — your Scrapely key from Step 1
   - `CALENDAR_LINK` — your booking link (Calendly, Cal.com, etc.)
   - `WEBHOOK_SECRETS` — you'll add this in the next step, skip for now
5. Railway will auto-deploy. Wait for the green checkmark.

### Step 5: Get your public URL

1. In Railway, go to your service → **Settings > Networking**
2. Under **Public Networking**, click **Generate Domain**
3. You'll get a URL like `https://your-app.up.railway.app`
4. Visit `https://your-app.up.railway.app/health` — you should see a JSON response showing your config status

### Step 6: Connect the webhook in Scrapely

1. Go to Scrapely dashboard → **Settings** → **Global Webhook**
2. Click **Add Webhook**
3. Paste your Railway URL from Step 5
4. Scrapely auto-generates an `X-Webhook-Key` secret — **copy that value**
5. Turn on **"Enable Webhook Notifications"**
6. Turn on **"Send Webhook for All Replies"**
7. Click **Save Settings**

### Step 7: Add the webhook secret to Railway

1. Go back to Railway → your service → **Variables** tab
2. Add `WEBHOOK_SECRETS` and paste the `X-Webhook-Key` you copied from Scrapely
3. Railway will automatically redeploy

### Step 8: Verify everything works

Visit `https://your-app.up.railway.app/health` — you should see:

```json
{
  "status": "ok",
  "config": {
    "anthropic_key": "set",
    "scrapely_key": "set",
    "calendar_link": "set",
    "webhook_auth": "set",
    "offer_customized": true,
    "instructions_customized": true
  }
}
```

If anything shows `"MISSING"` or `false`, fix that variable or file and Railway will redeploy automatically.

That's it — your AI setter is live. When leads reply to your Scrapely DMs, the agent will auto-respond within seconds.

## Configuration Reference

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | Yes | Your Claude API key (must have billing enabled) |
| `SCRAPELY_API_KEY` | Yes | Your Scrapely API key (Settings > API) |
| `CALENDAR_LINK` | Yes | Your booking link (Calendly, Cal.com, etc.) |
| `WEBHOOK_SECRETS` | Yes | The `X-Webhook-Key` value from Scrapely Settings > Global Webhook |

### Follow-up Timing

By default, the agent sends:
- **Follow-up 1** — 2 days after the last message (casual nudge)
- **Follow-up 2** — 7 days after (final follow-up with calendar link)

To change this, edit the `FOLLOWUP_CHAIN` array in `src/server.js`.

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Config status check — shows which env vars are set and any issues |
| `GET` | `/test?conversation_id=XXX` | Dry-run — generates a reply without sending it |
| `POST` | `/` | Main webhook receiver |

After deploying, visit `/health` in your browser to verify everything is configured correctly. It will tell you exactly what's missing.

## Safety Features

- Skips negative sentiment replies (won't engage angry leads)
- Won't send more than 3 messages in a row without a response
- Adds a human-like delay (5-15 seconds) before each reply
- Respects `ai_setter_enabled: false` flag in Scrapely CRM
- Strips emojis and formatting from AI output

## Writing Your Offer (src/offer.md)

This is the most important file — it's what the AI knows about your business. If this is generic, the AI will sound generic.

See `src/offer.example.md` for a filled-in example you can reference.

**Tips for a good offer file:**
- Write like you're explaining your business to a friend, not writing a brochure
- Include real numbers ("12 calls in 2 weeks" beats "great results")
- Add 2-3 client results or testimonials — the AI uses these as proof points
- Mention pricing ranges so the AI can answer price questions without being evasive
- Keep it under 1 page — the AI doesn't need a novel, just the key selling points

**What to avoid:**
- Corporate jargon ("synergize", "leverage", "holistic solutions")
- Vague claims with no specifics ("we help businesses grow")
- Leaving placeholder text in the file — the AI will literally say "[Your Company Name]"

## Troubleshooting

**First thing to check** — Visit `https://your-app.up.railway.app/health` in your browser. It shows you exactly which environment variables are set, which are missing, and whether your offer/instructions files still have placeholder text.

**How to view logs** — Go to [railway.com](https://railway.com) → your project → click your service → **"Logs"** tab. Look for lines starting with `⚠️` or `❌` — these tell you exactly what's wrong. All webhook events and AI replies are logged with `[Webhook]`, `[Setter]`, `[FollowUp]` prefixes so you can trace what happened. For build errors, check the **"Deploy Logs"** tab instead.

**Deploy fails** — Check "Deploy Logs" in Railway. Usually means something went wrong during the build.

**Server keeps restarting** — You're missing `ANTHROPIC_API_KEY` or `SCRAPELY_API_KEY` in Railway Variables. The server won't run without both.

**No replies being sent** — Check that:
1. Your `SCRAPELY_API_KEY` is correct (visit `/health` to verify)
2. The webhook URL in Scrapely matches your Railway public URL
3. The `X-Webhook-Key` in Scrapely matches your `WEBHOOK_SECRETS` in Railway Variables
4. "Enable Webhook Notifications" and "Send Webhook for All Replies" are both on in Scrapely Settings

**No webhooks arriving at all** — You probably didn't enable Public Networking. Go to Railway → your service → **Settings > Networking > Generate Domain**. Then copy that URL to Scrapely.

**Getting 403 Forbidden** — Your `WEBHOOK_SECRETS` in Railway Variables doesn't match the `X-Webhook-Key` in Scrapely. Copy the exact value from Scrapely Settings and paste it in Railway.

**AI replies sound off** — Edit `src/instructions.md` and `src/offer.md`. The AI can only be as good as the context you give it. See the "Writing Your Offer" section above.
