#!/usr/bin/env node
/**
 * demo-mcp — a tiny Model Context Protocol server for the workshop.
 *
 * An MCP server exposes three kinds of things to an AI client (like Claude):
 *   - Tools:     actions the model can call (this file shows 4)
 *   - Resources: read-only data the model can fetch (this file shows 1)
 *   - Prompts:   reusable prompt templates (this file shows 1)
 *
 * It talks to the client over stdio (stdin/stdout), so there's no port or
 * web server — the client launches this process and pipes JSON-RPC to it.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// 1. Create the server. The name/version show up in the client.
const server = new McpServer({
  name: "demo-mcp",
  version: "1.0.0",
});

// ────────────────────────────────────────────────────────────
// TOOL 1: add — the "hello world" of MCP tools.
// Inputs are described with zod; the SDK turns them into a JSON
// schema so the model knows exactly what arguments to pass.
// ────────────────────────────────────────────────────────────
server.registerTool(
  "add",
  {
    title: "Add two numbers",
    description: "Add two numbers together and return the sum.",
    inputSchema: {
      a: z.number().describe("The first number"),
      b: z.number().describe("The second number"),
    },
  },
  async ({ a, b }) => ({
    content: [{ type: "text", text: `${a} + ${b} = ${a + b}` }],
  })
);

// ────────────────────────────────────────────────────────────
// TOOL 2: get_current_time — returns real data from the host.
// This is what makes MCP useful: the model gets info it can't
// otherwise know.
// ────────────────────────────────────────────────────────────
server.registerTool(
  "get_current_time",
  {
    title: "Get current time",
    description: "Get the current date and time on the server.",
    inputSchema: {
      timezone: z
        .string()
        .optional()
        .describe("IANA timezone, e.g. 'America/New_York'. Defaults to local."),
    },
  },
  async ({ timezone }) => {
    const now = new Date();
    const formatted = timezone
      ? now.toLocaleString("en-US", { timeZone: timezone })
      : now.toString();
    return { content: [{ type: "text", text: formatted }] };
  }
);

// ────────────────────────────────────────────────────────────
// TOOL 3: get_weather — a mock "API call".
// Swap the fake data for a real fetch() to a weather API and
// you have a genuinely useful tool. This shows the pattern.
// ────────────────────────────────────────────────────────────
server.registerTool(
  "get_weather",
  {
    title: "Get weather",
    description: "Get a (mock) weather report for a city.",
    inputSchema: {
      city: z.string().describe("City name, e.g. 'Tokyo'"),
    },
  },
  async ({ city }) => {
    // In a real server you'd do:
    //   const res = await fetch(`https://api.example.com/weather?q=${city}`);
    //   const data = await res.json();
    const conditions = ["sunny", "cloudy", "rainy", "windy"];
    const pick = conditions[city.length % conditions.length];
    const temp = 15 + (city.length % 15);
    return {
      content: [
        { type: "text", text: `Weather in ${city}: ${pick}, ${temp}°C (mock data)` },
      ],
    };
  }
);

// ────────────────────────────────────────────────────────────
// TOOL 4: get_live_weather — a REAL API call (no API key needed).
// Uses Open-Meteo: first geocode the city to lat/lon, then fetch
// the current weather. This is the "graduation" from the mock
// tool above — same shape, real data.
// ────────────────────────────────────────────────────────────
const WEATHER_CODES: Record<number, string> = {
  0: "clear sky", 1: "mainly clear", 2: "partly cloudy", 3: "overcast",
  45: "fog", 48: "rime fog", 51: "light drizzle", 61: "rain", 63: "moderate rain",
  65: "heavy rain", 71: "snow", 80: "rain showers", 95: "thunderstorm",
};

server.registerTool(
  "get_live_weather",
  {
    title: "Get live weather",
    description: "Get the REAL current weather for a city using the free Open-Meteo API.",
    inputSchema: {
      city: z.string().describe("City name, e.g. 'Tokyo'"),
    },
  },
  async ({ city }) => {
    // Step 1: turn the city name into coordinates.
    const geoRes = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`
    );
    const geo = (await geoRes.json()) as {
      results?: { latitude: number; longitude: number; name: string; country?: string }[];
    };
    if (!geo.results?.length) {
      return { content: [{ type: "text", text: `Couldn't find a city named "${city}".` }] };
    }
    const { latitude, longitude, name, country } = geo.results[0];

    // Step 2: fetch the current weather for those coordinates.
    const wxRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code,wind_speed_10m`
    );
    const wx = (await wxRes.json()) as {
      current: { temperature_2m: number; weather_code: number; wind_speed_10m: number };
    };
    const c = wx.current;
    const desc = WEATHER_CODES[c.weather_code] ?? `code ${c.weather_code}`;

    return {
      content: [
        {
          type: "text",
          text: `Live weather in ${name}${country ? ", " + country : ""}: ${desc}, ${c.temperature_2m}°C, wind ${c.wind_speed_10m} km/h.`,
        },
      ],
    };
  }
);

// ────────────────────────────────────────────────────────────
// RESOURCE: read-only data the model can pull in as context.
// Here we expose a static "about" document.
// ────────────────────────────────────────────────────────────
server.registerResource(
  "about",
  "demo://about",
  {
    title: "About this server",
    description: "Information about the demo MCP server.",
    mimeType: "text/plain",
  },
  async (uri) => ({
    contents: [
      {
        uri: uri.href,
        text: "This is a demo MCP server built for a workshop. It has four tools (add, get_current_time, get_weather, get_live_weather), one resource, and one prompt.",
      },
    ],
  })
);

// ────────────────────────────────────────────────────────────
// PROMPT: a reusable template the user can invoke in the client.
// ────────────────────────────────────────────────────────────
server.registerPrompt(
  "summarize_weather",
  {
    title: "Summarize weather",
    description: "Ask the model to compare the weather in two cities.",
    argsSchema: {
      city1: z.string().describe("First city"),
      city2: z.string().describe("Second city"),
    },
  },
  ({ city1, city2 }) => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: `Use the get_weather tool to check ${city1} and ${city2}, then tell me which one I should visit today and why.`,
        },
      },
    ],
  })
);

// ────────────────────────────────────────────────────────────
// Start the server on stdio. Note: log to stderr, NEVER stdout —
// stdout is reserved for the JSON-RPC protocol messages.
// ────────────────────────────────────────────────────────────
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("demo-mcp running on stdio");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
