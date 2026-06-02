# 🛠️ Workshop: Build Your Own MCP Server — Participant Steps

Follow along with the instructor. Each step has a ✅ checkpoint so you know it worked.

> **What we're building:** an MCP server — a small program that gives Claude new
> abilities (tools). By the end, you'll ask Claude *"what's the weather in Tokyo?"*
> and it will call **your** code to answer.

---

## 0. Prerequisites (do this BEFORE the workshop)

- [ ] **Node.js 18+** installed → check: `node --version`
- [ ] **git** installed → check: `git --version`
- [ ] A code editor (VS Code is fine)
- [ ] *(Optional, for the Python track)* **Python 3.10+** → check: `python3 --version`

✅ **Checkpoint:** `node --version` prints `v18` or higher.

---

## 1. Get the code

```bash
git clone https://github.com/zeeshan8281/demo-mcp
cd demo-mcp
```

✅ **Checkpoint:** `ls` shows `src`, `package.json`, `README.md`, `python`.

---

## 2. Install dependencies

```bash
npm install
```

✅ **Checkpoint:** a `node_modules` folder appears, no red errors.

---

## 3. Build the server

```bash
npm run build
```

This compiles `src/index.ts` → `build/index.js`.

✅ **Checkpoint:** a `build` folder appears with `index.js` inside.

---

## 4. Test it in the Inspector (no AI yet!)

```bash
npm run inspect
```

A browser tab opens (the **MCP Inspector**). Then:

1. Click **Connect** (top left) if not already connected.
2. Go to the **Tools** tab.
3. Run `add` with `a = 2`, `b = 3` → you should see **`2 + 3 = 5`**.
4. Run `get_live_weather` with `city = Tokyo` → you should see **real** weather. 🌧️
5. Peek at the **Resources** and **Prompts** tabs too.

✅ **Checkpoint:** `get_live_weather` returns a real temperature for Tokyo.

> Stop the Inspector with `Ctrl + C` in the terminal when done.

---

## 5. Connect it to Claude

```bash
claude mcp add demo-mcp -- node "$(pwd)/build/index.js"
```

Then open Claude Code and ask:

> *"What's the weather in Tokyo using the demo tools?"*

✅ **Checkpoint:** Claude calls `get_live_weather` and answers with live data.

---

## 6. 🚀 Add your OWN tool

Open `src/index.ts`. Find a `server.registerTool(...)` block and copy this in
below it:

```ts
server.registerTool(
  "greet",
  {
    title: "Greet someone",
    description: "Say hello to a person by name.",
    inputSchema: {
      name: z.string().describe("The person's name"),
    },
  },
  async ({ name }) => ({
    content: [{ type: "text", text: `Hello, ${name}! 👋` }],
  })
);
```

Then rebuild and reconnect:

```bash
npm run build
```

Restart Claude (or the Inspector) and call your new `greet` tool.

✅ **Checkpoint:** your `greet` tool runs and returns `Hello, <name>! 👋`.

---

## 🐍 Python track (optional alternative)

Prefer Python? Do this instead of steps 2–5:

```bash
cd python
python3 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
mcp dev server.py                # opens the Inspector
```

To connect to Claude:

```bash
claude mcp add demo-mcp-py -- "$(pwd)/.venv/bin/python" "$(pwd)/server.py"
```

---

## 🧠 The two rules to remember

1. **Descriptions are everything.** Claude decides whether to use a tool based
   only on its title, description, and input descriptions. Vague = unused.
2. **Never print to stdout.** stdout is the protocol channel.
   - TypeScript: use `console.error` (not `console.log`)
   - Python: use the `logging` module (not `print`)

---

## 🆘 Troubleshooting

| Problem | Fix |
| ------- | --- |
| `tsc: command not found` | Run `npm install` first. |
| Python: `No matching distribution found for mcp` | You're on Python < 3.10. Install 3.10+ and recreate the venv. |
| `npm install` fails with `EACCES` cache error | Run `npm cache clean --force`, then retry. |
| Inspector won't open | Copy the URL it prints in the terminal into your browser manually. |
| Claude doesn't see the tools | Make sure you used the **absolute** path and ran `npm run build` first. |
```
