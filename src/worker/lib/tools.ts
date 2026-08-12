import { tool } from "ai";
import { z } from "zod";

// Server-side tool requiring approval (dynamic based on input)
const getWeatherInformationTool = tool({
  description:
    "Get the current weather information for a specific city. Always use this tool when the user asks about weather.",
  inputSchema: z.object({
    city: z.string().describe("The name of the city to get weather for"),
  }),
  execute: async ({ city }) => {
    // sleep 2s
    await new Promise((res) => setTimeout(res, 2000));
    return "The current weather in " + city + " is Sunny, 25°C.";
  },
});

const getRandomNumber = tool({
  description: "Get a random number between 0 and 100",
  inputSchema: z.object({}),
  execute: async () => {
    await new Promise((res) => setTimeout(res, 2000));
    return Math.floor(Math.random() * 100);
  },
});

// Client-executed tool (no execute = client handles via onToolCall)
const getLocation = tool({
  description: "Get user location from browser",
  inputSchema: z.object({}),
  // No execute function
});

// Export AI SDK tools for server-side use
export const tools = {
  getWeatherInformationTool,
  getLocation,
  getRandomNumber,
};
