#!/usr/bin/env python3
"""
demo-mcp (Python) — the same workshop MCP server, in Python.

An MCP server exposes three kinds of things to an AI client (like Claude):
  - Tools:     actions the model can call (this file shows 3)
  - Resources: read-only data the model can fetch (this file shows 1)
  - Prompts:   reusable prompt templates (this file shows 1)

It talks to the client over stdio, so there's no port or web server — the
client launches this process and pipes JSON-RPC to it.

We use FastMCP, the high-level helper from the official `mcp` SDK. Decorators
turn plain functions into tools/resources/prompts, and type hints + docstrings
become the schema and description the model reads.
"""

from datetime import datetime
from zoneinfo import ZoneInfo

from mcp.server.fastmcp import FastMCP

# Create the server. The name shows up in the client.
mcp = FastMCP("demo-mcp")


# ─────────────────────────────────────────────────────────────
# TOOL 1: add — the "hello world" of MCP tools.
# Type hints become the input schema; the docstring becomes the
# description the model uses to decide when to call it.
# ─────────────────────────────────────────────────────────────
@mcp.tool()
def add(a: float, b: float) -> str:
    """Add two numbers together and return the sum."""
    return f"{a} + {b} = {a + b}"


# ─────────────────────────────────────────────────────────────
# TOOL 2: get_current_time — returns real data from the host.
# This is what makes MCP useful: the model gets info it can't
# otherwise know.
# ─────────────────────────────────────────────────────────────
@mcp.tool()
def get_current_time(timezone: str | None = None) -> str:
    """Get the current date and time on the server.

    Args:
        timezone: IANA timezone, e.g. 'America/New_York'. Defaults to local.
    """
    if timezone:
        now = datetime.now(ZoneInfo(timezone))
    else:
        now = datetime.now()
    return now.strftime("%Y-%m-%d %H:%M:%S %Z").strip()


# ─────────────────────────────────────────────────────────────
# TOOL 3: get_weather — a mock "API call".
# Swap the fake data for a real HTTP request and you have a
# genuinely useful tool. This shows the pattern.
# ─────────────────────────────────────────────────────────────
@mcp.tool()
def get_weather(city: str) -> str:
    """Get a (mock) weather report for a city.

    Args:
        city: City name, e.g. 'Tokyo'
    """
    # In a real server you'd do something like:
    #   import httpx
    #   r = httpx.get(f"https://api.example.com/weather?q={city}")
    #   data = r.json()
    conditions = ["sunny", "cloudy", "rainy", "windy"]
    pick = conditions[len(city) % len(conditions)]
    temp = 15 + (len(city) % 15)
    return f"Weather in {city}: {pick}, {temp}°C (mock data)"


# ─────────────────────────────────────────────────────────────
# RESOURCE: read-only data the model can pull in as context.
# Here we expose a static "about" document at demo://about.
# ─────────────────────────────────────────────────────────────
@mcp.resource("demo://about")
def about() -> str:
    """Information about the demo MCP server."""
    return (
        "This is a demo MCP server built for a workshop. It has three tools "
        "(add, get_current_time, get_weather), one resource, and one prompt."
    )


# ─────────────────────────────────────────────────────────────
# PROMPT: a reusable template the user can invoke in the client.
# ─────────────────────────────────────────────────────────────
@mcp.prompt()
def summarize_weather(city1: str, city2: str) -> str:
    """Ask the model to compare the weather in two cities."""
    return (
        f"Use the get_weather tool to check {city1} and {city2}, then tell me "
        "which one I should visit today and why."
    )


# ─────────────────────────────────────────────────────────────
# Start the server on stdio.
# ─────────────────────────────────────────────────────────────
if __name__ == "__main__":
    mcp.run(transport="stdio")
