# AI Setter Agent — Scrapely

AI-powered Twitter DM setter that listens for Scrapely webhook events and generates human-like replies using Claude. Goal: book calls.

## What it does

1. **Receives webhook events** from Scrapely (positive first replies + back-and-forth follow-ups)
2. **Generates AI replies** using Claude, matching the lead's tone and style
3. **Sends DMs** back through the Scrapely API
4. **Auto follow-ups** — checks hourly for stale conversations and sends follow-up nudges on a configurable cadence (default: day 2 + day 7)

No proposal generation. No scraping. Just the setter.

## Setup

```bash
npm install
cp .env.example .env   # fill in your keys
```

## Run

```bash
# Production
npm start

# Development (auto-restart on file changes)
npm run dev
```

## Configuration

### Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | Yes | Claude API key |
| `SCRAPELY_API_KEY` | Yes | Scrapely API key for fetching conversations + sending DMs |
| `SCRAPELY_API_BASE` | No | Scrapely API base URL (default: `https://app.scrapely.co/api/v1`) |
| `WEBHOOK_SECRETS` | No | Comma-separated webhook auth keys (sent via `x-webhook-key` header) |
| `PORT` | No | Server port (default: `9002`) |
| `CALENDAR_LINK` | No | Booking link injected into AI replies |
| `OUTBOUND_PROXY` | No | Proxy for outbound requests (ip:port) |
| `OUTBOUND_PROXY_AUTH` | No | Proxy auth (user:pass) |

### AI behavior

Edit these files to change how the AI setter responds:

- **`src/instructions.md`** — SDR personality, tone rules, message flow logic, hard rules
- **`src/offer.md`** — Product details, social proof, testimonials, pricing context

### Follow-up chain

Edit `FOLLOWUP_CHAIN` in `src/server.js` to adjust timing and prompts:

```js
const FOLLOWUP_CHAIN = [
  { delayDays: 2, prompt: "..." },  // first nudge
  { delayDays: 7, prompt: "..." },  // final follow-up
];
```

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/health` | No | Health check |
| `GET` | `/test?conversation_id=XXX` | Yes | Dry-run — generates reply without sending |
| `POST` | `/` | Yes | Main webhook receiver |

## Webhook payload

The Scrapely webhook sends events like:

```json
{
  "event": "new_reply",
  "sender_screen_name": "leadhandle",
  "lead_name": "Lead Name",
  "conversation_id": "abc-123",
  "account_id": "uuid",
  "account_twitter_handle": "ourhandle",
  "message_text": "yeah sounds interesting",
  "sentiment": "positive",
  "is_back_and_forth": false
}
```

Events handled:
- `new_reply` — first positive reply from a lead
- `reply_back_and_forth` — subsequent messages in an existing conversation

## Architecture

```
Scrapely Webhook → POST / → processMessage()
                              ├─ First reply  → processFirstReply() → generateSetterReply() → sendDM()
                              └─ Follow-up    → processBackAndForth() → generateSetterReply() → sendDM()

Hourly cron → followUpLoop() → generateFollowUpMessage() → sendDM()
```

## Safety guards

- Skips negative sentiment replies
- Skips "message request accepted" system messages (multi-language)
- Won't reply if 3+ consecutive messages sent without lead response
- Respects `ai_setter_enabled: false` in CRM
- Human-like delay (5-15s) before each reply
- Sanitizes AI output (strips emojis, dashes, double spaces)
