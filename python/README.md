# demo-mcp — Python version 🐍

The same workshop MCP server (**4 tools, 1 resource, 1 prompt**) written in
Python using the official [`mcp`](https://github.com/modelcontextprotocol/python-sdk)
SDK's `FastMCP` helper.

Prefer TypeScript? See the [project root](../README.md).

---

## Quick start

```bash
cd python

# 1. Create a virtual environment
python3 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate

# 2. Install the MCP SDK
pip install -r requirements.txt

# 3. Test it in the visual Inspector 🔍
mcp dev server.py
```

`mcp dev` opens a browser UI. Go to the **Tools** tab → call `add` with
`a=2, b=3`, or `get_weather` with `city=Tokyo`.

---

## Connect it to Claude Code

Use the venv's Python so the `mcp` package is found (run from the `python/` folder):

```bash
claude mcp add demo-mcp-py -- "$(pwd)/.venv/bin/python" "$(pwd)/server.py"
```

Then ask Claude: *"what's the weather in Tokyo using the demo tools?"*

## Connect it to Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "demo-mcp-py": {
      "command": "/ABSOLUTE/PATH/TO/demo-mcp/python/.venv/bin/python",
      "args": ["/ABSOLUTE/PATH/TO/demo-mcp/python/server.py"]
    }
  }
}
```

Restart Claude Desktop.

---

## How to add your own tool

Add a decorated function in `server.py`, then restart the server:

```python
@mcp.tool()
def my_tool(name: str) -> str:
    """What it does — the model reads this to decide when to use it."""
    return f"Hello, {name}!"
```

### Two golden rules

1. **Write clear docstrings & type hints.** They *are* the schema and
   description the model uses to decide whether to call your tool.
2. **Never `print()` to stdout.** stdout is the JSON-RPC channel. Use the
   `logging` module (it writes to stderr) if you need to log.
