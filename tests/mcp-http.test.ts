import { readFileSync } from "node:fs";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import app from "../src/server.js";
import { connectPageBody } from "../src/connect-page.js";
import { landingPage } from "../src/landing-page.js";

const accept = { "content-type": "application/json", accept: "application/json, text/event-stream" };

describe("public copy", () => {
  it("does not say free or state a price", () => {
    const pages = [
      connectPageBody("http://127.0.0.1:3000"),
      landingPage("http://127.0.0.1:3000", "", "")
    ].join("\n");
    expect(pages.toLowerCase()).not.toMatch(/\bfree\b/);
    expect(pages).not.toMatch(/[$€£]\s*\d/);
    expect(pages).toMatch(/14-day trial/);
    expect(pages).toMatch(/\bPro\b/);
  });
});

describe("review project boundary", () => {
  it("keeps schema and server env names on this Review project", () => {
    const schema = readFileSync("supabase/schema.sql", "utf8");
    const server = readFileSync("src/server.ts", "utf8");
    expect(schema).toMatch(/review_businesses/);
    expect(schema).toMatch(/review_cases/);
    expect(schema).not.toMatch(/catalog_|claim_|continuity_/);
    expect(server).toMatch(/REVIEW_SUPABASE_URL/);
    expect(server).toMatch(/REVIEW_STRIPE_SECRET_KEY/);
    expect(server).not.toMatch(/process\.env\.SUPABASE_/);
    expect(server).not.toMatch(/process\.env\.STRIPE_/);
    expect(server).not.toMatch(/process\.env\.APP_BASE_URL/);
  });
});

describe("streamable http discovery", () => {
  let port = 0;
  let server: ReturnType<typeof createServer>;

  beforeAll(async () => {
    server = createServer(app);
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    port = (server.address() as AddressInfo).port;
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  });

  async function post(body: unknown, headers: Record<string, string> = {}) {
    const response = await fetch(`http://127.0.0.1:${port}/mcp`, {
      method: "POST",
      headers: { ...accept, ...headers },
      body: JSON.stringify(body)
    });
    const text = await response.text();
    return { status: response.status, text, json: text ? JSON.parse(text) : null };
  }

  it("initializes, accepts the initialized notification, answers ping, and lists tools with no token", async () => {
    const init = await post({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: { protocolVersion: "2025-03-26", capabilities: {}, clientInfo: { name: "review-test", version: "0.0.1" } }
    });
    expect(init.status).toBe(200);
    expect(init.json.result.serverInfo.name).toBe("Review");

    const ready = await post({ jsonrpc: "2.0", method: "notifications/initialized" });
    expect(ready.status).toBe(202);

    const ping = await post({ jsonrpc: "2.0", id: 2, method: "ping" });
    expect(ping.status).toBe(200);
    expect(ping.json.result).toEqual({});

    const tools = await post({ jsonrpc: "2.0", id: 3, method: "tools/list" });
    expect(tools.status).toBe(200);
    const names = tools.json.result.tools.map((tool: { name: string; description: string }) => tool.name);
    expect(names).toEqual([
      "list_businesses",
      "create_business",
      "get_business_cases",
      "save_case",
      "check_public_reply"
    ]);
    const described = JSON.stringify(tools.json.result.tools);
    expect(described.toLowerCase()).not.toMatch(/\bfree\b/);
    expect(described).not.toMatch(/[$€£]\s*\d/);
    expect(described).toMatch(/approved reply|stored wording/i);
    expect(described).toMatch(/refund/i);
    expect(described).toMatch(/replacement/i);
    expect(described).toMatch(/timeline/i);
  });

  it("rejects an API key header", async () => {
    const response = await post({ jsonrpc: "2.0", id: 1, method: "tools/list" }, { "x-api-key": "not-a-token" });
    expect(response.status).toBe(401);
    expect(response.json.error).toMatch(/API key/i);
  });

  it("rejects a bearer token that is not a signed-in session", async () => {
    const response = await post({ jsonrpc: "2.0", id: 1, method: "tools/list" }, { authorization: "Bearer sk_live_not_a_jwt" });
    expect(response.status).toBe(401);
    expect(response.json.error).toMatch(/API key/i);
  });

  it("serves public pages without secrets and without the word free", async () => {
    for (const path of ["/", "/connect", "/terms", "/privacy", "/support", "/health"]) {
      const response = await fetch(`http://127.0.0.1:${port}${path}`);
      expect(response.status).toBe(200);
      const body = await response.text();
      expect(body.toLowerCase()).not.toMatch(/\bfree\b/);
      expect(body).not.toMatch(/[$€£]\s*\d/);
      expect(body).not.toMatch(/REVIEW_SUPABASE|REVIEW_STRIPE|service_role|sk_live|sk_test/);
    }
  });

  it("requires a subscriber before a tool call", async () => {
    const response = await post({
      jsonrpc: "2.0",
      id: 4,
      method: "tools/call",
      params: { name: "list_businesses", arguments: {} }
    });
    expect(response.status).toBe(401);
  });
});
