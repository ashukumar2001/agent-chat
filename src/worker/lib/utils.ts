import {
    convertToModelMessages,
    Tool,
    ToolCallOptions,
    ToolSet,
    UIMessageStreamWriter,
    getToolName,
    isToolUIPart,
    UIMessage,
} from 'ai';
import { HumanInTheLoopUIMessage } from '../types/misc';

/**
 * Cleans reasoning content from messages to prevent compatibility issues when switching to non-thinking models
 * @param messages - Array of messages to clean
 * @returns Cleaned messages array with reasoning content removed
 */
export function cleanMessagesForReasoning<T extends UIMessage>(messages: T[]): T[] {
    return messages.map((message) => {
        // If message doesn't have parts, return as is
        if (!message.parts || !Array.isArray(message.parts)) {
            return message;
        }

        // Filter out reasoning parts and clean provider metadata
        const cleanedParts = message.parts.filter((part) => {
            const partType = part.type as string;
            return partType !== "reasoning";
        });
        // Remove providerMetadata that contains thoughtSignature for Google models
        for (let i = 0; i < cleanedParts.length; i++) {
            const part = cleanedParts[i] as any; // Type assertion to handle non-standard properties
            if (part.providerMetadata) {
                delete part.providerMetadata;
            }
        }
        // Clean provider metadata that might contain thoughtSignature
        const cleanedMessage: any = {
            ...message,
            parts: cleanedParts
        };
        return cleanedMessage as T;
    }).filter((message) => {
        // Keep user and system messages regardless
        if (message.role === "user" || message.role === "system") {
            return true;
        }

        // For assistant messages, only keep them if they have meaningful content
        if (message.role === "assistant") {
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

// Approval string to be shared across frontend and backend
export const APPROVAL = {
    YES: 'Yes, confirmed.',
    NO: 'No, denied.',
} as const;

function isValidToolName<K extends PropertyKey, T extends object>(
    key: K,
    obj: T,
): key is K & keyof T {
    return key in obj;
}

/**
 * Processes tool invocations where human input is required, executing tools when authorized.
 *
 * @param options - The function options
 * @param options.tools - Map of tool names to Tool instances that may expose execute functions
 * @param options.writer - UIMessageStream writer for sending results back to the client
 * @param options.messages - Array of messages to process
 * @param executionFunctions - Map of tool names to execute functions
 * @returns Promise resolving to the processed messages
 */
export async function processToolCalls<
    Tools extends ToolSet,
    ExecutableTools extends {
        [Tool in keyof Tools as Tools[Tool] extends { execute: Function }
        ? never
        : Tool]: Tools[Tool];
    },
>(
    {
        writer,
        messages,
    }: {
        tools: Tools; // used for type inference
        writer: UIMessageStreamWriter;
        messages: HumanInTheLoopUIMessage[]; // IMPORTANT: replace with your message type
    },
    executeFunctions: {
        [K in keyof Tools & keyof ExecutableTools]?: (
            args: ExecutableTools[K] extends Tool<infer P> ? P : never,
            context: ToolCallOptions,
        ) => Promise<any>;
    },
): Promise<HumanInTheLoopUIMessage[]> {
    const lastMessage = messages[messages.length - 1];
    const parts = lastMessage.parts;
    if (!parts) return messages;

    const processedParts = await Promise.all(
        parts.map(async part => {
            // Only process tool invocations parts
            if (!isToolUIPart(part)) return part;

            const toolName = getToolName(part);

            // Only continue if we have an execute function for the tool (meaning it requires confirmation) and it's in a 'result' state
            if (!(toolName in executeFunctions) || part.state !== 'output-available')
                return part;

            let result;

            if (part.output === APPROVAL.YES) {

                // Get the tool and check if the tool has an execute function.
                if (
                    !isValidToolName(toolName, executeFunctions) ||
                    part.state !== 'output-available'
                ) {
                    return part;
                }

                const toolInstance = executeFunctions[toolName] as Tool['execute'];
                if (toolInstance) {
                    writer.write({
                        type: "data-tool-call-status",
                        id: part.toolCallId,
                        data: {
                            status: "loading",
                            toolCallId: part.toolCallId,
                        }
                    })
                    result = await toolInstance(part.input, {
                        messages: convertToModelMessages(messages),
                        toolCallId: part.toolCallId,
                    });
                } else {
                    result = 'Error: No execute function found on tool';
                }
            } else if (part.output === APPROVAL.NO) {
                result = 'Error: User denied access to tool execution';
            } else {
                // For any unhandled responses, return the original part.
                return part;
            }
            writer.write({
                type: "data-tool-call-status",
                id: part.toolCallId,
                data: {
                    status: "success",
                    toolCallId: part.toolCallId,
                }
            })
            // Forward updated tool result to the client.
            writer.write({
                type: 'tool-output-available',
                toolCallId: part.toolCallId,
                output: result,
            });

            // Return updated toolInvocation with the actual result.
            return {
                ...part,
                output: result,
            };
        }),
    );

    // Finally return the processed messages
    return [...messages.slice(0, -1), { ...lastMessage, parts: processedParts }];
}

export function getToolsRequiringConfirmation<
    T extends ToolSet,
// E extends {
//   [K in keyof T as T[K] extends { execute: Function } ? never : K]: T[K];
// },
>(tools: T): string[] {
    return (Object.keys(tools) as (keyof T)[]).filter(key => {
        const maybeTool = tools[key];
        return typeof maybeTool.execute !== 'function';
    }) as string[];
}