# AI Chat UI (React + TypeScript + Vercel AI SDK)

Production-ready AI chat application with real streaming responses using Vercel AI SDK and multiple LLM providers.

## Supported Models
- **OpenAI**: GPT-4o, GPT-4o Mini, GPT-3.5 Turbo
- **Google Gemini**: Gemini 2.0 Flash, Gemini 1.5 Flash, Gemini 1.5 Pro
- **Mistral**: Mistral Large, Mistral Small, Codestral

## Features
- **Real AI streaming** with token-by-token updates
- **Responsive chat UI** with role-based message styling
- **Markdown rendering** with code blocks, lists, and links (sanitized with DOMPurify)
- **Real-time metrics** showing tokens, speed, and latency
- **Error handling** with automatic retry and exponential backoff
- **Model selector** to switch between 9 different models
- **Stop generation** to cancel ongoing responses
- **Conversation management** with history and trimming
- **Light/Dark themes** with system preference detection
- **Message actions**: Copy, feedback, regenerate
- **Accessibility** with ARIA labels and keyboard navigation

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure API Keys
Create a `.env` file:
```bash
cp .env.example .env
```

Add your API keys:
```env
GOOGLE_GENERATIVE_AI_API_KEY=your-google-api-key
MISTRAL_API_KEY=your-mistral-api-key
OPENAI_API_KEY=your-openai-api-key  # Optional
```

### 3. Run the Application
```bash
npm run dev:all
```

This starts:
- **Frontend** (Vite): http://localhost:5173
- **API Server** (Express): http://localhost:3001

Or run separately:
```bash
# Terminal 1
npm run dev:server

# Terminal 2
npm run dev
```

## Architecture

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **AI SDK**: Vercel AI SDK v6 (`ai`, `@ai-sdk/react`)
- **LLM Providers**: Google Gemini, Mistral AI
- **Backend**: Express.js with streaming support
- **Styling**: Tailwind CSS 4 + CSS variables

### Project Structure
```
src/
├── components/       # React components
│   ├── ui/          # Reusable UI primitives
│   ├── ChatHeader.tsx
│   ├── ChatInput.tsx
│   ├── MessageBubble.tsx
│   ├── MessageList.tsx
│   └── ...
├── hooks/           # Custom React hooks
│   └── useChat.ts   # Main chat logic
├── config/          # Configuration
│   └── models.ts    # Model definitions
├── __tests__/       # Test files
├── types.ts         # TypeScript types
└── App.tsx          # Root component
```

### Key Components
- **`useChat` hook**: Manages streaming, state, retry logic, and error handling
- **`MessageBubble`**: Renders messages with markdown, streaming indicator, and actions
- **`MessageList`**: Handles auto-scroll, windowing, and welcome screen
- **`ChatInput`**: Textarea with auto-resize and keyboard shortcuts

## Streaming Implementation

### How It Works
1. User sends message via `ChatInput`
2. `useChat` hook calls Vercel AI SDK's `sendMessage`
3. Backend receives request, selects LLM provider
4. `streamText` generates response and pipes to client
5. Frontend updates UI token-by-token via `useChat` state
6. Metrics tracked: first token time, total tokens, duration

### Error Handling
- **Retry logic**: 3 attempts with exponential backoff
- **Transient errors**: Auto-retry for 5xx and 429 status codes
- **User feedback**: Error notifications with manual retry button
- **Abort support**: Stop generation mid-stream

## AI-Specific UX Features

1. **Streaming indicator** - Animated progress bar during response generation
2. **Thinking state** - Spinner shown while waiting for first token
3. **Role distinction** - Visual separation of user/assistant messages
4. **Stop generation** - Cancel button during streaming
5. **Regenerate response** - Retry last assistant message
6. **Performance metrics** - Real-time tokens/sec, TTFT, duration
7. **Error recovery** - Retry flow with exponential backoff
8. **Message windowing** - Only render last 60 messages for performance
9. **Conversation trimming** - Summarize old messages to reduce context
10. **Copy to clipboard** - One-click message copying
11. **Feedback system** - Thumbs up/down for responses
12. **Auto-scroll** - Smart scrolling that respects user position
13. **Offline detection** - Warning when network unavailable
14. **Model selector** - Switch between providers mid-conversation
15. **Theme toggle** - Light/dark mode with smooth transitions

## Performance & Scalability

### Optimizations
- **Message windowing**: Limits visible messages to 60 (configurable)
- **React.memo**: Prevents unnecessary re-renders of MessageBubble
- **useMemo/useCallback**: Stable references for expensive computations
- **ResizeObserver**: Efficient DOM change detection for auto-scroll
- **Debounced localStorage**: 300ms delay before persisting
- **Streaming updates**: Only active message updates, not entire list

### Scaling Considerations
- Add Redis for conversation persistence
- Implement message virtualization for 1000+ messages
- Add rate limiting on backend
- Use CDN for static assets
- Implement server-side content moderation
- Add conversation search/indexing
- Consider WebSocket for lower latency

## Security

- ✅ API keys in `.env` (gitignored)
- ✅ DOMPurify sanitizes all markdown output
- ✅ CORS configured on backend
- ✅ No sensitive data in client code
- ✅ Input validation on server

## Testing

The application includes comprehensive error handling, retry logic, and performance optimizations that have been manually tested across multiple browsers and scenarios.

## Production Deployment

### Deploy to Render.com

1. **Create Web Service**
   - Go to [Render.com](https://render.com)
   - Click "New" → "Web Service"
   - Connect your GitHub repository

2. **Configure Service**
   - **Name**: `react-ai-chat`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `node server.mjs`

3. **Add Environment Variables**
   - `GOOGLE_GENERATIVE_AI_API_KEY` = your-google-api-key
   - `MISTRAL_API_KEY` = your-mistral-api-key
   - `PORT` = (leave empty, Render sets automatically)

4. **Deploy**
   - Click "Create Web Service"
   - Render will build and deploy automatically
   - Your app will be available at: `https://your-app.onrender.com`

### Alternative: Deploy to Railway/Vercel

See deployment guides for [Railway](https://railway.app) or [Vercel](https://vercel.com) in their respective documentation.

## License

MIT
