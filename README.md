# genui (front end)

Describe an interface in plain words and genui builds it as a real, interactive UI. A free LLM returns a validated JSON component tree, and this Next.js app renders it with a fixed set of safe components.

**Live demo:** <add your Vercel URL>
**Back end:** [genui-backend](https://github.com/kyumna/genui-backend)

<!-- Add screenshots here: landing page, chat with the UI panel open, a shared page -->

## How it works

```
prompt -> FastAPI -> Gemini / Groq -> JSON tree -> validate -> SSE stream
                                                                 |
                  Next.js: zod check -> component registry -> React UI
```

- **No generated code is ever executed.** The model only returns data: `{ type, props, children }`.
- **Allow-listed components:** Stack, Grid, Card, Heading, Text, Stat, Table, Chart, Slider, Tabs. Unknown types and invalid props are not rendered.
- **Safe styling:** the AI can pick colors from a named palette or `#rrggbb`. Nothing else reaches CSS.
- **Streaming:** a short description streams in first, then the UI appears as a card that opens in a side panel.
- **Save and share:** each UI can be saved to Postgres (Neon) and opened at `/u/<slug>`.
- **Export:** download any UI as a standalone HTML file.

## Run locally

```bash
npm install
# create .env.local first (see below)
npm run dev
```

`.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Without `NEXT_PUBLIC_API_URL` the app runs in preview mode with a canned response. Start the back end from the [genui-backend](https://github.com/kyumna/genui-backend) repo for real generation.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |

## Stack

Next.js 16, React 19, Tailwind CSS 4, zod, Recharts. Hosted on Vercel.
