import type {
    UIMessage,
} from "ai";

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
            return !partType.startsWith("tool-");
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




        // // Remove providerMetadata that contains thoughtSignature for Google models
        for (let i = 0; i < cleanedParts.length; i++) {
            if (!!cleanedParts[i].providerMetadata) {
                delete cleanedParts[i].providerMetadata;
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