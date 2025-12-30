<div align="center">

# 🤖 Eddy

### Open Source AI Chat Application

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-F38020?logo=cloudflare&logoColor=white)](https://workers.cloudflare.com/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vercel AI SDK](https://img.shields.io/badge/AI%20SDK-5.0-000000?logo=vercel&logoColor=white)](https://sdk.vercel.ai/)

A modern, multi-provider AI chat application built with React, Cloudflare Workers, and the Vercel AI SDK. Chat with models from **Google**, **Anthropic**, **OpenAI**, **xAI**, **Perplexity**, **Mistral**, **DeepSeek**, and more — all from a single unified interface.

<!-- [**Demo**](#) · [**Report Bug**](../../issues) · [**Request Feature**](../../issues) -->

</div>

---

## ✨ Features

- 🌐 **Multi-Provider Support** — Switch between AI providers seamlessly (Google Gemini, Claude, GPT-4, Grok, Perplexity, Mistral, DeepSeek, Llama via OpenRouter)
- 🔍 **Web Search Integration** — Enable real-time web search with Google Search grounding for supported models
- 💬 **Real-time Streaming** — Instant responses with streaming text generation
- 🧠 **Reasoning Models** — Support for thinking/reasoning models with visible thought processes
- 🔐 **Secure Authentication** — GitHub OAuth and anonymous sessions via Better Auth
- 🔑 **BYOK (Bring Your Own Key)** — Use your own API keys for each provider
- 💾 **Persistent Chat History** — Conversations stored in Cloudflare D1
- 🎨 **Beautiful UI** — Modern interface with dark/light mode, built with Tailwind CSS and Radix UI
- ⚡ **Edge Deployment** — Lightning-fast responses from Cloudflare's global network
- 🛠️ **Tool Calling** — Extensible tool system with human-in-the-loop confirmations

## 🖼️ Screenshots

<div align="center">
<img src="https://res.cloudinary.com/dirdj9gyk/image/upload/v1765736197/eddy-preview_uw0ly2.png" alt="Eddy Chat Interface" width="800"/>
</div>

## 🏗️ Tech Stack

| Layer                | Technology                                                 |
| -------------------- | ---------------------------------------------------------- |
| **Frontend**         | React 19, TanStack Router, TailwindCSS 4, Radix UI, Motion |
| **Backend**          | Cloudflare Workers, Hono, tRPC                             |
| **AI Integration**   | Vercel AI SDK, Cloudflare Agents                           |
| **Database**         | Cloudflare D1 (SQLite), Drizzle ORM                        |
| **Authentication**   | Better Auth (GitHub OAuth, Anonymous)                      |
| **State Management** | Cloudflare Durable Objects                                 |

<!-- ## 🤖 Supported Models

<table>
<tr>
<td>

**Google**

- Gemini 2.5 Pro
- Gemini 2.5 Flash
- Gemini 2.0 Flash

</td>
<td>

**Anthropic**

- Claude 4 Sonnet
- Claude 4 Opus
- Claude 3.5 Haiku

</td>
<td>

**OpenAI**

- GPT-4.1
- GPT-4o
- o3 / o4-mini

</td>
</tr>
<tr>
<td>

**xAI**

- Grok 3
- Grok 3 Mini

</td>
<td>

**Perplexity**

- Sonar Pro
- Sonar

</td>
<td>

**Mistral**

- Mistral Large
- Mistral Medium

</td>
</tr>
<tr>
<td>

**DeepSeek**

- DeepSeek Chat
- DeepSeek Reasoner

</td>
<td>

**Meta (via OpenRouter)**

- Llama 4 Scout
- Llama 4 Maverick

</td>
<td>

_...and more!_

</td>
</tr>
</table> -->

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [bun](https://www.npmjs.com/) or [pnpm](https://pnpm.io/)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/)
- A Cloudflare account (free tier works)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/ashukumar2001/eddy.git
   cd eddy
   ```

2. **Install dependencies**

   ```bash
   bun install
   ```

3. **Set up environment variables**

   Create a `.dev.vars` file in the root directory:

   ```env
   # Authentication (required)
   BETTER_AUTH_SECRET=your-secret-key-min-32-chars
   BETTER_AUTH_URL=http://localhost:5173

   # GitHub OAuth
   GITHUB_CLIENT_ID=your-github-client-id
   GITHUB_CLIENT_SECRET=your-github-client-secret

   # Encryption Key (32 bytes (256 bit))
   DATA_ENCRYPTION_KEY=your-key-to-encrypt-api-keys
   ```

4. **Set up the database**

   ```bash
   # Create the D1 database
   npx wrangler d1 create eddy-ai-chat-db-dev

   # Update wrangler.json with your database ID
   # Then run migrations
   bun run db:migrate:local
   ```

5. **Start the development server**

   ```bash
   bun run dev
   ```

6. **Open your browser**

   Navigate to [http://localhost:5173](http://localhost:5173)

## 📝 Available Scripts

| Command                    | Description                      |
| -------------------------- | -------------------------------- |
| `bun run dev`              | Start development server         |
| `bun run build`            | Build for production             |
| `bun run preview`          | Preview production build locally |
| `bun run deploy`           | Deploy to Cloudflare Workers     |
| `bun run db:generate`      | Generate database migrations     |
| `bun run db:migrate:local` | Apply migrations locally         |
| `bun run db:studio`        | Open Drizzle Studio              |
| `bun run lint`             | Run ESLint                       |
| `bun run typecheck`        | Run TypeScript type checking     |

## 🔧 Configuration

<!-- ### Adding API Keys

Users can add their own API keys through the settings panel in the app. Supported providers:

- **Google AI** — [Get API Key](https://aistudio.google.com/app/apikey)
- **Anthropic** — [Get API Key](https://console.anthropic.com/)
- **OpenAI** — [Get API Key](https://platform.openai.com/api-keys)
- **xAI** — [Get API Key](https://console.x.ai/)
- **Perplexity** — [Get API Key](https://www.perplexity.ai/settings/api)
- **Mistral** — [Get API Key](https://console.mistral.ai/)
- **OpenRouter** — [Get API Key](https://openrouter.ai/keys) -->

### Environment Variables

| Variable               | Description                                  | Required |
| ---------------------- | -------------------------------------------- | -------- |
| `BETTER_AUTH_SECRET`   | Secret key for authentication (min 32 chars) | ✅       |
| `BETTER_AUTH_URL`      | Base URL of your application                 | ✅       |
| `GITHUB_CLIENT_ID`     | GitHub OAuth App Client ID                   | ✅       |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth App Client Secret               | ✅       |

## 🚢 Deployment

### Deploy to Cloudflare Workers

1. **Login to Cloudflare**

   ```bash
   npx wrangler login
   ```

2. **Create production database**

   ```bash
   npx wrangler d1 create eddy-ai-chat-db-prod
   ```

3. **Set production secrets**

   ```bash
   npx wrangler secret put --env-file .env.development
   ```

4. **Deploy**

   ```bash
   bun run deploy
   ```

### One-Click Deploy

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/ashukumar2001/eddy)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Vercel AI SDK](https://sdk.vercel.ai/) — Unified AI SDK for multiple providers
- [Cloudflare Workers](https://workers.cloudflare.com/) — Edge computing platform
- [Hono](https://hono.dev/) — Ultrafast web framework
- [TanStack](https://tanstack.com/) — Powerful tools for React
- [Shadcn/ui](https://ui.shadcn.com/) — Beautiful UI components
- [Better Auth](https://www.better-auth.com/) — Authentication library

---

<div align="center">

**[⬆ Back to Top](#-eddy)**

</div>
