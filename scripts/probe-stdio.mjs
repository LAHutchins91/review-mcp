import { spawn } from "node:child_process";

const port = process.env.PROBE_PORT || "3877";
const child = spawn(process.execPath, ["dist/src/server.js"], {
  stdio: ["pipe", "pipe", "pipe"],
  env: {
    PATH: process.env.PATH,
    HOME: process.env.HOME,
    LANG: process.env.LANG || "C.UTF-8",
    NODE_ENV: "production",
    PORT: port,
    REVIEW_APP_BASE_URL: `http://127.0.0.1:${port}`
  }
});

let stderr = "";
child.stderr.on("data", (chunk) => {
  stderr += chunk.toString();
});

const messages = [];
let buffer = "";
child.stdout.on("data", (chunk) => {
  buffer += chunk.toString();
  let newline = buffer.indexOf("\n");
  while (newline >= 0) {
    const line = buffer.slice(0, newline).trim();
    buffer = buffer.slice(newline + 1);
    if (line) messages.push(JSON.parse(line));
    newline = buffer.indexOf("\n");
  }
});

function send(message) {
  child.stdin.write(`${JSON.stringify(message)}\n`);
}

function waitFor(predicate, timeoutMs) {
  const started = Date.now();
  return new Promise((resolve, reject) => {
    const timer = setInterval(() => {
      const found = messages.find(predicate);
      if (found) {
        clearInterval(timer);
        resolve(found);
      } else if (Date.now() - started > timeoutMs) {
        clearInterval(timer);
        reject(new Error(`Timed out. stderr=${stderr} messages=${JSON.stringify(messages)}`));
      }
    }, 20);
  });
}

await new Promise((resolve) => setTimeout(resolve, 400));
send({
  jsonrpc: "2.0",
  id: 1,
  method: "initialize",
  params: {
    protocolVersion: "2025-03-26",
    capabilities: {},
    clientInfo: { name: "review-probe", version: "0.0.1" }
  }
});
await waitFor((message) => message.id === 1, 5000);
send({ jsonrpc: "2.0", method: "notifications/initialized" });
send({ jsonrpc: "2.0", id: 2, method: "ping" });
await waitFor((message) => message.id === 2, 5000);
send({ jsonrpc: "2.0", id: 3, method: "tools/list" });
const tools = await waitFor((message) => message.id === 3, 5000);

const httpTools = await fetch(`http://127.0.0.1:${port}/mcp`, {
  method: "POST",
  headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
  body: JSON.stringify({ jsonrpc: "2.0", id: 3, method: "tools/list" })
});
if (!httpTools.ok) throw new Error(`HTTP tools/list failed: ${httpTools.status} ${await httpTools.text()}`);

console.log(JSON.stringify(tools));
child.kill();
await new Promise((resolve) => child.once("exit", resolve));
