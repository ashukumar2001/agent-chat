import { Agent, AgentContext, Connection, WSMessage } from "agents";
import {
    streamText,
    LanguageModel,
    UIMessage as MessageAISDK,
    convertToModelMessages,
    createUIMessageStreamResponse,
    createUIMessageStream,
    UIMessageStreamOnFinishCallback,
    stepCountIs,
} from "ai";
import { AsyncLocalStorage } from "node:async_hooks";
import { DEFAULT_SYSTEM_PROMPT, DEFUALT_MODEL } from "../lib/config";
import { MODELS } from "../lib/models";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { MessageType, OutgoingMessage } from "../../react-app/types/ai-types";
import { getUserKey } from "../lib/user-keys";
import { executions, tools } from "../lib/tools";
import { processToolCalls } from "../lib/utils";
import { HumanInTheLoopUIMessage } from "../types/misc";

const decoder = new TextDecoder();

export const agentContext = new AsyncLocalStorage<MyChatAgent>();

export class MyChatAgent extends Agent<Env> {
    messages: MessageAISDK[] = [];

    /**
     * Map of message `id`s to `AbortController`s
     * useful to propagate request cancellation signals for any external calls made by the agent
     */
    #chatMessageAbortControllers = new Map<string, AbortController>();

    constructor(ctx: AgentContext, env: Env) {
        super(ctx, env);
        this.sql`create table if not exists cf_ai_chat_agent_messages (
            id text primary key,
            message text not null,
            created_at datetime default current_timestamp
          )`;
        this.messages = ((this.sql`select * from cf_ai_chat_agent_messages` || []) as { id: string, message: string }[])
            .map((row) => {
                try {
                    return JSON.parse(row.message);
                } catch (error) {
                    console.error('Failed to parse message from database:', error);
                    return null;
                }
            })
            .filter((message): message is MessageAISDK => message !== null);
    }

    /**
     * Private method to handle errors with proper error propagation
     */
    async #tryCatch<T>(fn: () => Promise<T>): Promise<T> {
        try {
            return await fn();
        } catch (e) {
            throw this.onError(e);
        }
    }
    /**
     * Private method to broadcast chat messages to all connections except excluded ones
     */
    #broadcastChatMessage(message: OutgoingMessage, exclude?: string[]): void {
        this.broadcast(JSON.stringify(message), exclude);
    }

    /**
     * Private method to get or create an abort signal for a given message ID
     */
    #getAbortSignal(id: string): AbortSignal | undefined {
        if (typeof id !== "string") {
            return undefined;
        }
        if (!this.#chatMessageAbortControllers.has(id)) {
            this.#chatMessageAbortControllers.set(id, new AbortController());
        }
        return this.#chatMessageAbortControllers.get(id)?.signal;
    }

    /**
     * Remove an abort controller from the cache of pending message responses
     */
    #removeAbortController(id: string): void {
        this.#chatMessageAbortControllers.delete(id);
    }

    /**
     * Abort all pending requests and clear the cache of AbortControllers
     */
    #destroyAbortControllers(): void {
        for (const controller of this.#chatMessageAbortControllers.values()) {
            controller?.abort();
        }
        this.#chatMessageAbortControllers.clear();
    }

    /**
     * Propagate an abort signal for any requests associated with the given message id
     */
    #cancelChatRequest(id: string): void {
        if (this.#chatMessageAbortControllers.has(id)) {
            const abortController = this.#chatMessageAbortControllers.get(id);
            abortController?.abort();
        }
    }

    /**
     * Private method to handle streaming response replies
     */
    async #reply(id: string, response: Response): Promise<void> {
        return this.#tryCatch(async () => {
            if (response.body) {
                const reader = response.body.getReader();
                try {
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;

                        const body = decoder.decode(value);
                        this.#broadcastChatMessage({
                            id,
                            type: MessageType.CF_AGENT_USE_CHAT_RESPONSE,
                            body,
                            done: false
                        });
                    }
                } finally {
                    reader.releaseLock();
                }
            }

            this.#broadcastChatMessage({
                id,
                type: MessageType.CF_AGENT_USE_CHAT_RESPONSE,
                body: "",
                done: true
            });
        });
    }

    async onMessage(connection: Connection, message: WSMessage): Promise<void> {
        if (typeof message === "string") {
            let data;
            try {
                data = JSON.parse(message);
            } catch (error) {
                return;
            }

            if (data.type === MessageType.CF_AGENT_USE_CHAT_REQUEST && data.init.method === "POST") {
                const { body } = data.init;

                const { messages, model, userId } = JSON.parse(body as string);
                this.#broadcastChatMessage({ type: MessageType.CF_AGENT_CHAT_MESSAGES, messages }, [connection.id]);

                this.persistMessages(messages, [connection.id]);

                const chatMessageId = data.id;
                const abortSignal = this.#getAbortSignal(chatMessageId);

                return this.#tryCatch(async () => {
                    try {
                        const response = await this.onChatMessage(messages, {
                            config: { model, userId },
                            abortSignal,
                            onFinish: async ({ messages: allMessages }) => {
                                await this.persistMessages(allMessages, [connection.id]);
                                this.#removeAbortController(chatMessageId);
                            }
                        });
                        if (response) {
                            await this.#reply(chatMessageId, response);
                        } else {
                            // Log a warning for observability
                            console.warn(
                                `onChatMessage returned no response for chatMessageId: ${chatMessageId}`
                            );
                            // TODO: Send a fallback message to the client
                        }
                    } catch (error) {
                        console.error("Agent onMessage - error in onChatMessage:", error);
                        throw error;
                    }
                });

            }
            if (data.type === MessageType.CF_AGENT_CHAT_CLEAR) {
                this.#destroyAbortControllers();
                this.sql`delete from cf_ai_chat_agent_messages`;
                this.messages = [];
                this.#broadcastChatMessage({ type: MessageType.CF_AGENT_CHAT_CLEAR }, [connection.id]);
            } else if (data.type === MessageType.CF_AGENT_CHAT_MESSAGES) {
                await this.persistMessages(data.messages, [connection.id]);
            } else if (data.type === MessageType.CF_AGENT_CHAT_REQUEST_CANCEL) {
                this.#cancelChatRequest(data.id);
            }
        }
    }

    async persistMessages(
        messages: MessageAISDK[],
        excludeBroadcastIds?: string[]
    ): Promise<void> {
        this.sql`delete from cf_ai_chat_agent_messages`;
        for (const message of messages) {
            this.sql`insert into cf_ai_chat_agent_messages (id, message) values (${message.id},${JSON.stringify(message)})`;
        }
        this.messages = messages;
        this.#broadcastChatMessage({ type: MessageType.CF_AGENT_CHAT_MESSAGES, messages }, excludeBroadcastIds);
    };

    async onChatMessage(messages: HumanInTheLoopUIMessage[], options?: {
        abortSignal: AbortSignal | undefined;
        config: { model: string, userId: string };
        onFinish?: UIMessageStreamOnFinishCallback<MessageAISDK>;
    }): Promise<Response | undefined> {
        return agentContext.run(this, async () => {
            try {
                const modelId = options?.config.model || DEFUALT_MODEL;
                const modelConfig = MODELS.find((model) => model.id === modelId);
                if (!modelConfig) {
                    throw new Error(`Model ${modelId} not found`);
                };
                let modelInstance: LanguageModel | null = null;
                const apiKey = await getUserKey(options?.config.userId!, modelConfig.providerId, this.env)
                // Use the dynamic model configuration instead of hardcoded model
                if (modelConfig.apiSdk) {
                    modelInstance = modelConfig.apiSdk(apiKey);
                } else {
                    // Fallback to Google SDK if no apiSdk is configured
                    const google = createGoogleGenerativeAI({
                        apiKey: "",
                    });
                    modelInstance = google(modelConfig.id);

                }
                const toolsEnabled = modelConfig.tools === true;

                // // Filter reasoning content for non-thinking models to prevent API errors
                // const filteredMessages = modelConfig.reasoning ? messages : cleanMessagesForReasoning(messages);




                // Convert the AI SDK stream to the format expected by the frontend
                const stream = createUIMessageStream({
                    originalMessages: messages,
                    execute: async ({ writer }) => {
                        const processedMessages = await processToolCalls({ messages, writer, tools }, executions);

                        const modelMessages = convertToModelMessages(processedMessages, {
                            ignoreIncompleteToolCalls: true,
                        });
                        const result = streamText({
                            model: modelInstance!,
                            system: DEFAULT_SYSTEM_PROMPT,
                            messages: modelMessages,
                            abortSignal: options?.abortSignal,
                            tools: toolsEnabled ? tools : undefined,
                            onError: (error) => {
                                console.error("Agent - streamText error:", error);
                            },
                            stopWhen: stepCountIs(10),
                            providerOptions: {
                                ...(modelConfig.reasoning && {
                                    google: {
                                        thinkingConfig: {
                                            thinkingBudget: 2000,
                                            includeThoughts: true,
                                        },
                                    },
                                }),
                            },
                        });
                        writer.merge(result.toUIMessageStream({ sendReasoning: modelConfig.reasoning, originalMessages: processedMessages, onFinish: options?.onFinish }));
                    },
                    onError: (error) => {
                        console.error("Error while streaming: ", error)
                        return "Error while streaming: ";
                    },
                });

                const resp = createUIMessageStreamResponse({ stream, });
                return resp;
            } catch (error) {
                console.error("Agent onChatMessage - caught error:", error);
                throw error;
            }
        });
    }
    async onRequest(request: Request): Promise<Response> {
        const url = new URL(request.url);
        if (url.pathname.endsWith("/get-messages")) {
            const messages = ((this.sql`select * from cf_ai_chat_agent_messages` || []) as { id: string, message: string }[])
                .map((row) => {
                    try {
                        return JSON.parse(row.message);
                    } catch (error) {
                        console.error('Failed to parse message from database:', error);
                        return null;
                    }
                })
                .filter((message): message is MessageAISDK => message !== null);
            return Response.json(messages);
        }
        return super.onRequest(request);
    }
    async destroy(): Promise<void> {
        this.#destroyAbortControllers();
        this.sql`delete from cf_ai_chat_agent_messages`;
        this.messages = [];
        this.broadcast(JSON.stringify({ type: "cf_agent_chat_messages", messages: [] }), []);
    }
}