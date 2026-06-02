# demo-mcp — Build Your Own MCP Server 🛠️

A tiny [Model Context Protocol](https://modelcontextprotocol.io) server for the workshop.
It exposes **3 tools**, **1 resource**, and **1 prompt** to any MCP client (like Claude).

---

## What is MCP, in one breath?

MCP is a standard way to give an AI model new abilities. You write a small
**server** that exposes:

| Concept       | What it is                                  | Example here          |
| ------------- | ------------------------------------------- | --------------------- |
| **Tool**      | An action the model can call                | `add`, `get_weather`  |
| **Resource**  | Read-only data the model can fetch          | `demo://about`        |
| **Prompt**    | A reusable prompt template                  | `summarize_weather`   |

The client (Claude) launches your server and talks to it over **stdio** using
JSON-RPC. No ports, no web server.

---

## Quick start (fork → run in 3 commands)

```bash
git clone <your-fork-url> demo-mcp
cd demo-mcp
npm install && npm run build && npm run inspect
```

That builds the server and opens the visual Inspector so you can call the tools
immediately. Full step-by-step below.

---

## Workshop steps

### 1. Install dependencies

```bash
npm install
```

### 2. Build it

```bash
npm run build
```

This compiles `src/index.ts` → `build/index.js`.

### 3. Test it with the Inspector (the fun part 🔍)

The MCP Inspector is a visual UI to poke at your server before wiring it into Claude:

```bash
npm run inspect
```

It opens a browser window. Try the **Tools** tab → call `add` with `a=2, b=3`,
or `get_weather` with `city=Tokyo`. Check the **Resources** and **Prompts** tabs too.

### 4. Connect it to Claude Code

Run this from inside the project folder (`$(pwd)` fills in the absolute path for you):

```bash
claude mcp add demo-mcp -- node "$(pwd)/build/index.js"
```

Then in a Claude Code session, ask: *"what's 2+2 using the demo tools?"* or
*"what's the weather in Tokyo?"* — Claude will call your tools.

### 4b. (Alternative) Connect it to Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "demo-mcp": {
      "command": "node",
      "args": ["/ABSOLUTE/PATH/TO/demo-mcp/build/index.js"]
    }
  }
}
```

> Replace `/ABSOLUTE/PATH/TO` with where you cloned the repo. Run `pwd` inside
> the folder to get it.

Restart Claude Desktop. Your tools appear under the 🔌 icon.

---

## How to add your own tool

Copy this pattern in `src/index.ts`, then `npm run build` again:

```ts
server.registerTool(
  "my_tool",
  {
    title: "My Tool",
    description: "What it does — the model reads this to decide when to use it.",
    inputSchema: {
      name: z.string().describe("Describe each input clearly"),
    },
  },
  async ({ name }) => ({
    content: [{ type: "text", text: `Hello, ${name}!` }],
  })
);
```

### Two golden rules

1. **Write clear `description`s.** The model decides whether to call your tool
   based entirely on the title, description, and input descriptions.
2. **Never `console.log` to stdout.** stdout is the protocol channel. Use
   `console.error` for logging (it goes to stderr).

---

## Project layout

```
demo-mcp/
├── src/index.ts      ← the server (start reading here)
├── package.json      ← scripts & deps
├── tsconfig.json     ← TypeScript config
└── build/            ← compiled output (after npm run build)
```

Happy hacking! 🚀
