# OpenOcean

Your personal AI assistant. Clean, secure, malware-free.

> Inspired by OpenClaw — rebuilt from scratch with trust-first design.

## Install

    npm i -g openocean
    openocean onboard

Requires Node.js 22+

## What is OpenOcean?

OpenOcean is a self-hosted personal AI assistant that runs entirely on your
own machine. It connects to the messaging apps you already use — Telegram,
Discord, WhatsApp — and lets you chat with your favourite AI from anywhere.

Your data never leaves your machine. No cloud. No subscriptions. No malware.

## Why OpenOcean?

| | OpenClaw | OpenOcean |
|---|---|---|
| Default network bind | 0.0.0.0 (exposed) | 127.0.0.1 (local only) |
| Skill security | Post-hoc VirusTotal scan | Pre-publish sandbox review |
| API spend limits | None built-in | Hard limits + alerts |
| Install method | curl-pipe-bash | Signed npm package |
| Windows support | WSL2 only | Native support |
| Audit log | Basic | Full timestamped log |
| Web dashboard | None | Built-in at localhost:3000 |
| Session tracking | Basic | Full per-session spend tracking |

## Supported AI providers

Bring your own API key — OpenOcean never touches it:

- Anthropic — Claude Sonnet 4.6, Opus 4.6, Haiku 4.5
- OpenAI — GPT-4o, GPT-4o Mini, O3 Mini
- Google — Gemini 2.0 Flash, Gemini 2.0 Pro
- DeepSeek — DeepSeek Chat, DeepSeek Reasoner
- Qwen — Qwen Max, Qwen Turbo
- Nvidia NIM — Qwen 3.5 122B and more
- Mock — no API key needed, for testing

## Supported channels

- Telegram — full command support, typing indicators
- Discord — DMs and server mentions
- WhatsApp — via Baileys, QR code pairing
- More coming soon — Slack, Signal

## Features

- Self-hosted — runs on your machine, your data stays local
- Multi-model — switch between any AI provider in your config
- Security layer — allowlist, spend guard, permission checker
- Spend tracking — token and cost tracking per session, per channel, per day
- Web dashboard — real-time UI at localhost:3000
- Onboarding wizard — openocean onboard guides you step by step
- Audit log — every event timestamped and recorded
- No telemetry — nothing phoned home, ever

## Getting started

### Requirements

- Node.js 22 or higher
- pnpm 9 or higher
- Git

### Option 1 — Install from npm (recommended)

    npm i -g openocean
    openocean onboard

### Option 2 — Install from source

    git clone https://github.com/Ayush-3plus4/openocean.git
    cd openocean
    pnpm install
    cd packages/cli
    node --experimental-strip-types src/index.ts onboard

### Start

    cd packages/gateway
    pnpm dev

Then message your bot on Telegram, Discord, or WhatsApp.

### Web dashboard

In a second terminal:

    cd apps/web
    pnpm dev

Open http://localhost:3000 to see real-time spend and session tracking.

## Project structure

    openocean/
    ├── packages/
    │   ├── gateway/     # WebSocket control plane
    │   ├── agent/       # AI runtime - multi-model support
    │   ├── channels/    # Telegram, Discord, WhatsApp adapters
    │   ├── cli/         # Onboarding wizard
    │   └── storage/     # Local spend tracking
    ├── apps/
    │   └── web/         # Real-time dashboard
    └── scripts/         # Build and release scripts

## Commands

Send these to your bot on any channel:

- /reset — start a new conversation
- /spend — show today's token usage and cost
- /report — full detailed spend report
- /week — last 7 days summary
- /model — show current AI model
- /history — full conversation history with timestamps and token counts
- /sessions — list all recorded sessions

## Security

OpenOcean is built security-first:

- Always binds to 127.0.0.1 — never exposed to the internet by default
- Allowlist — only approved users can message your assistant
- Hard API spend limits — no surprise bills
- Full audit log — every event timestamped and recorded
- No telemetry — nothing phoned home
- MIT licensed — read every line

## Roadmap

- Session replay — done
- OpenOcean Hub — curated skill registry
- Slack channel
- Signal channel
- Incognito sessions — zero-log ephemeral mode
- CONTRIBUTING.md

## Community

- Reddit: https://www.reddit.com/r/selfhosted/comments/1rzrkdv
- npm: https://www.npmjs.com/package/openocean
- Issues: https://github.com/Ayush-3plus4/openocean/issues

## License

MIT — do whatever you want with it.

Built by Ayush-3plus4 and contributors.