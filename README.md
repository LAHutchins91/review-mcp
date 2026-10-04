# Review

Review keeps a business’s approved public replies to customer reviews. An assistant may send a reply only when it matches stored wording. It cannot offer a refund, a replacement, or a timeline that was not saved for that case.

A check refuses any outgoing reply that does not match a stored approved reply for that case. It also refuses a refund, a replacement, or a timeline that is not already saved on that case. A closed case does not authorize a reply.

It works with ChatGPT, Claude, Gemini, Grok, and Cursor, plus any other MCP client that can do Streamable HTTP and OAuth. It is not a ChatGPT-only plugin.

Sign in with your Review account when the assistant opens OAuth. Do not paste an API key or password into a header. Review does not accept API keys. Review tools need Pro or an active trial. The site offers a 14-day trial, then Pro.

The MCP path on a deployment is `/mcp`. Registry metadata is in `server.json` (`io.github.LAHutchins91/review`).

## What the assistant can do

After you approve the connection, the server exposes these tools:

- list_businesses
- create_business
- get_business_cases
- save_case
- check_public_reply

`check_public_reply` does not save the reply. Do not send a reply when its verdict is rejected. Saved refund, replacement, and timeline wording is data the assistant may repeat only for that case. It is not a price for Review itself. The assistant only calls these tools when you and the host allow it.

## Connect

Cursor, in `~/.cursor/mcp.json` or a project `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "review": {
      "url": "https://YOUR_REVIEW_HOST/mcp"
    }
  }
}
```

Claude Code:

```bash
claude mcp add --transport http review https://YOUR_REVIEW_HOST/mcp
```

Other clients: add the same URL, choose OAuth, and leave client id and secret empty. Review supports dynamic client registration. Full steps for each assistant are on the connect page.

## Run

```bash
npm install
npm run build
npm start
```

`npm start` runs `node dist/src/server.js`. When stdin is not a terminal, the process also speaks MCP on stdio so a sandbox can list tools without a token. A terminal keeps the HTTP listener only.

The server starts with empty Supabase and Stripe settings. Discovery (`initialize`, `notifications/initialized`, `tools/list`, and `ping`) does not need a user token. Saving or reading cases requires a signed-in subscriber.

Copy `supabase/schema.sql` into this Review project’s Supabase SQL editor before review tools can read or write. Review uses its own Supabase project. Set these environment variables in the host, not in the repo:

- `REVIEW_SUPABASE_URL`
- `REVIEW_SUPABASE_ANON_KEY`
- `REVIEW_SUPABASE_SERVICE_ROLE_KEY`
- `REVIEW_STRIPE_SECRET_KEY`
- `REVIEW_STRIPE_WEBHOOK_SECRET`
- `REVIEW_STRIPE_PRICE_MONTHLY`
- `REVIEW_STRIPE_PRICE_YEARLY`
- `REVIEW_APP_BASE_URL`
- `PORT`
- `REVIEW_OPENAI_APPS_CHALLENGE` (optional)

Stripe Checkout shows the billing interval and trial before purchase.
