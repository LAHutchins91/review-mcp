import { canonicalPublicOrigin } from "./public-url.js";

function htmlEscape(value: string) {
  return value.replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch] ?? ch));
}

export function landingConnectLead(baseUrl: string) {
  const origin = canonicalPublicOrigin(baseUrl);
  const mcp = htmlEscape(`${origin}/mcp`);
  const connect = htmlEscape(`${origin}/connect`);
  return `<p>MCP address: <code>${mcp}</code>. <a href="${connect}">Connect an assistant</a>.</p>`;
}

export function connectPageBody(baseUrl: string) {
  const origin = canonicalPublicOrigin(baseUrl);
  const mcp = htmlEscape(`${origin}/mcp`);
  return `<p>Review is one OAuth-protected reply desk for ChatGPT, Claude, Gemini, Grok, Cursor, and any other MCP client that can reach this server. Review tools require a Review account with Pro or an active 14-day trial. Billing stays on the site. No assistant can change your plan.</p>
<section><h2>Shared connection</h2>
<p>MCP address:</p><p><code>${mcp}</code></p>
<p>Transport: Streamable HTTP. Sign in with your own Review account when the assistant opens OAuth. Do not paste an API key, access token, or password into a header or chat. Review does not accept API keys. Revoke a host at any time from <a href="/connections">connected applications</a>.</p>
<ol><li><a href="/app">Sign in</a> and open or create a business you will recognize by name.</li><li>Add the MCP address in your assistant using the steps below. Choose dynamic registration and OAuth when the host asks how to authenticate. Leave client id and secret empty.</li><li>Approve Review, then ask the assistant to load the case before it sends a public reply.</li></ol>
</section>
<section><h2>1. ChatGPT and Codex</h2>
<p>Connect Review as a custom app. A public directory listing is not published yet.</p>
<ol><li>On workspace plans, an admin enables developer mode under Workspace settings, then Permissions and roles, then Connected data developer mode. Personal accounts that already offer custom apps can skip that toggle.</li><li>Open Apps, then Create.</li><li>Enter the MCP address, choose OAuth, scan tools, and approve the Review sign-in.</li><li>Enable the app in the conversation.</li></ol>
<p>Codex can use this same MCP address. Request <code>offline_access</code> when the host offers refresh. Review’s authorization server advertises that scope.</p>
</section>
<section><h2>2. Claude</h2>
<p>Claude.ai, Claude Desktop, and Claude Code call Review from Claude’s servers. You do not install a local plugin.</p>
<ol><li>Add a custom connector and paste the MCP address. On a team workspace, an owner adds it first, then each member connects.</li><li>Name it Review.</li><li>Choose sign-in with OAuth. For the OAuth client, choose automatic registration. Leave client id and secret empty. Do not put a token in request headers.</li><li>Approve Review in the browser, then turn the connector on for the chat.</li></ol>
<p>Claude Code, from a terminal:</p>
<pre><code>claude mcp add --transport http review ${mcp}</code></pre>
<p>Do not pass an Authorization header. Claude Code opens the same OAuth flow. In a JSON config, set <code>"type": "http"</code> next to <code>url</code>.</p>
</section>
<section><h2>3. Gemini</h2>
<h3>Gemini Apps</h3>
<p>Google’s Gemini Apps can add an MCP server URL in the Gemini web app, subject to Google’s eligibility limits. Connect on the web. The link then works in the Gemini mobile app too.</p>
<ol><li>On a computer, open gemini.google.com, then Settings, then Connected apps.</li><li>Under custom apps, add a custom app and paste the MCP address.</li><li>Leave advanced credentials empty. Review supports dynamic client registration, so a client id is not required.</li><li>Finish Google’s sign-in, then type <code>@</code> and choose Review when you want that chat to use it.</li></ol>
<h3>Gemini CLI</h3>
<pre><code>gemini mcp add --transport http --scope user review ${mcp}</code></pre>
<p>That writes <code>~/.gemini/settings.json</code>. Do not set an Authorization header. If the CLI reports a missing issuer on the callback, Google is enforcing that parameter and the authorization server did not return it. Use Gemini Apps, or another host, until that redirect includes the issuer.</p>
<p>Gemini API remote MCP and Gemini Enterprise custom MCP are not a supported Review path. Do not paste a Review access token into an API request. Enterprise forms that require a pre-registered client id are not published by this server.</p>
</section>
<section><h2>4. Grok</h2>
<h3>Grok on the web</h3>
<ol><li>Open grok.com/connectors.</li><li>Choose New connector, then Custom.</li><li>Paste the MCP address and finish the sign-in Grok presents.</li></ol>
<p>On Grok Business and Enterprise, an admin provisions connectors before members can use them. The server must be reachable on the public internet.</p>
<h3>Grok Build</h3>
<pre><code>grok mcp add --transport http review ${mcp}</code></pre>
<p>OAuth runs in the browser on first use. The equivalent user config is:</p>
<pre><code>[mcp_servers.review]
url = "${mcp}"</code></pre>
<p>in <code>~/.grok/config.toml</code>. Do not set an Authorization header.</p>
<p>The xAI API remote-MCP tool accepts a static bearer token. Review does not issue API keys or long-lived tokens for that field. Use grok.com or Grok Build, which perform OAuth.</p>
</section>
<section><h2>5. Cursor and other MCP clients</h2>
<p>Cursor speaks remote Streamable HTTP with OAuth. In <code>~/.cursor/mcp.json</code> or a project <code>.cursor/mcp.json</code>:</p>
<pre><code>{
  "mcpServers": {
    "review": {
      "url": "${mcp}"
    }
  }
}</code></pre>
<p>Do not add headers or a static auth client id. Cursor registers a client and opens sign-in. Any other MCP client uses the same address when it supports Streamable HTTP, OAuth 2.0 with PKCE, and dynamic client registration. An unauthenticated tool call returns 401 with a WWW-Authenticate challenge pointing at <code>/.well-known/oauth-protected-resource/mcp</code>. Ask for the <code>email</code> scope. Add <code>offline_access</code> when the client can refresh tokens. Clients that call from their own servers should not send a browser Origin. Browser calls are accepted only from Review and the assistant sites listed in the server allowlist.</p>
</section>
<section><h2>After it connects</h2>
<p>Ask the assistant to load the case before it replies in public. An approved reply is the only wording it may send. It cannot offer a refund, a replacement, or a timeline that is not saved on that case. A closed case is not a current reply.</p>
<p>The assistant calls tools only when you and the host allow it. Disconnecting an application stops future access. It does not delete cases or cancel billing.</p>
</section>`;
}
