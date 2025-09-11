import { tool } from "ai";
import { z } from "zod";
const getWeatherInformation = tool({
    description: "Show the weather in a given city to the user.",
    inputSchema: z.object({ city: z.string() }),
});


const getLocalTime = tool({
    description: "get the local time for a specified location",
    inputSchema: z.object({ location: z.string() }),
    execute: async ({ location }) => {
        console.log("Getting local time for ", location);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return "12:01 PM"
    }
});

export const tools = {
    getLocalTime,
    getWeatherInformation
}

export const executions = {
    getWeatherInformation: async ({ city }: { city: string }) => {
        // sleep for 3 seconds
        await new Promise((resolve) => setTimeout(resolve, 10000));
        return `The weather in ${city} is sunny 😁`;
    }
};

export const toolsRequiringConfirmation = Object.keys(executions) as (keyof typeof tools)[];