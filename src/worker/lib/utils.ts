import {
    convertToModelMessages,
    DataStreamWriter,
    type UIMessage,
    ToolExecutionOptions,
    ToolSet,
} from "ai";
import { z } from "zod";
// Approval string to be shared across frontend and backend
export const APPROVAL = {
    YES: "Yes, confirmed.",
    NO: "No, denied.",
} as const;

function isValidToolName<K extends PropertyKey, T extends object>(
    key: K,
    obj: T
): key is K & keyof T {
    return key in obj;
}

export async function processToolCalls<Tools extends ToolSet, ExecutableTools extends {
    [Tool in keyof Tools as Tools[Tool] extends { execute: Function } ? never : Tool]: Tools[Tool]
}>({ dataStream, executions, messages, }: {
    tools: Tools, dataStream: DataStreamWriter, messages: UIMessage[],
    executions: {
        [K in keyof Tools & keyof ExecutableTools]?: (args: z.infer<ExecutableTools[K]["parameters"]>, context: ToolExecutionOptions) => Promise<unknown>
    },

}): Promise<UIMessage[]> {
    const lastMessage = messages[messages.length - 1];
    const parts = lastMessage.parts;
    if (!parts) return messages;

    const processedParts = await Promise.all(parts.map(async (part) => {
        if (part.type !== "tool-invocation") return part;
        const { toolInvocation } = part;
        const toolName = toolInvocation.toolName;

        if (!(toolName in executions) || toolInvocation.state !== "result")
            return part;

        let result: unknown;

        if (toolInvocation.result === APPROVAL.YES) {
            if (!isValidToolName(toolName, executions) || toolInvocation.state !== "result") {
                return part;
            }

            const toolInstance = executions[toolName];
            if (toolInstance) {
                result = await toolInstance(toolInvocation.args, {
                    messages: convertToModelMessages(messages),
                    toolCallId: toolInvocation.toolCallId,
                })
            } else {
                result = "Error: No execute function found on tool";
            }
        } else if (toolInvocation.result === APPROVAL.NO) {
            result = "Error: User denied access to tool execution";
        } else {
            return part;
        }

        dataStream.write({
            'type': 'tool-result',

            'value': {
                toolCallId: toolInvocation.toolCallId,
                result
            }
        })

        return {
            ...part,
            toolInvocation: {
                ...toolInvocation,
                result
            }
        }
    }));

    return [...messages.slice(0, -1), { ...lastMessage, parts: processedParts }]
}

/**
 * Cleans tool calls from messages to prevent compatibility issues when switching between LLMs
 * @param messages - Array of messages to clean
 * @returns Cleaned messages array with tool calls removed
 */
export function cleanMessagesForTools<T extends UIMessage>(messages: T[]): T[] {
    return messages.map((message) => {
        // If message doesn't have parts, return as is
        if (!message.parts || !Array.isArray(message.parts)) {
            return message;
        }

        // Filter out tool-invocation parts (and any other tool-related parts)
        const cleanedParts = message.parts.filter((part) => {
            // Type assertion to handle the union type properly
            const partType = part.type as string;
            return partType !== "tool-invocation" && !partType.includes("tool");
        });

        // Return message with cleaned parts
        return {
            ...message,
            parts: cleanedParts
        };
    }).filter((message) => {
        // Keep user and system messages regardless
        if (message.role === "user" || message.role === "system") {
            return true;
        }

        // For assistant messages, only keep them if they have meaningful content
        if (message.role === "assistant") {
            // If message has content string, keep it
            if (message.content && typeof message.content === "string" && message.content.trim()) {
                return true;
            }

            // If message has non-empty parts with text content, keep it
            if (message.parts && message.parts.length > 0) {
                return message.parts.some(part => {
                    const partType = part.type as string;
                    return partType === "text" && "text" in part && part.text && String(part.text).trim();
                });
            }

            // Remove empty assistant messages
            return false;
        }

        // Keep other message types (tool, etc.)
        return true;
    });
}