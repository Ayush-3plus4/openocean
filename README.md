# OpenOcean

Your personal AI assistant. Clean, secure, malware-free.

> Inspired by OpenClaw — rebuilt from scratch with trust-first design.

## What is OpenOcean?

OpenOcean is a self-hosted personal AI assistant that runs entirely on your own machine. It connects to the messaging apps you already use — Telegram, Discord, and more — and lets you chat with your favourite AI from anywhere.

Your data never leaves your machine. No cloud. No subscriptions. No malware.

## Why OpenOcean over OpenClaw?

| | OpenClaw | OpenOcean |
|---|---|---|
| Default network bind | 0.0.0.0 (public) | 127.0.0.1 (local only) |
| Skill security | Post-hoc VirusTotal scan | Pre-publish sandbox review |
| API spend limits | None built-in | Hard limits + alerts |
| Install method | curl-pipe-bash | Signed npm package |
| Linux + Windows app | Not available | Built-in support |
| Onboarding | CLI wizard only | GUI + CLI wizard |
| Audit log | Basic | Full timestamped log |

## Supported AI providers

Bring your own API key from any of these:

- Anthropic — Claude Sonnet, Opus, Haiku
- OpenAI — GPT-4o, GPT-4o Mini, O3 Mini
- Google — Gemini 2.0 Flash, Gemini 2.0 Pro
- DeepSeek — DeepSeek Chat, DeepSeek Reasoner
- Qwen — Qwen Max, Qwen Turbo

No API key yet? Use the built-in mock provider to try OpenOcean for free.

## Supported channels

- Telegram
- Discord
- More coming soon (WhatsApp, Slack, Signal)

## Getting started

### Requirements

- Node.js 22 or higher
- pnpm 9 or higher
- Git

### Install

git clone https://github.com/Ayush-3plus4/openocean.git
cd openocean
pnpm install

### Set up

Run the onboarding wizard:
cd packages/cli
node --experimental-strip-types src/index.ts onboard

The wizard will ask you which AI provider you want to use, guide you through getting an API key, and set up your messaging channels step by step.

### Start

cd packages/gateway
pnpm dev

Then message your bot on Telegram or Discord — OpenOcean will reply instantly.

## Project structure

openocean/
├── packages/
│   ├── gateway/     # WebSocket control plane
│   ├── agent/       # AI runtime - multi-model support
│   ├── channels/    # Telegram, Discord adapters
│   ├── cli/         # Onboarding wizard
│   └── storage/     # Local encrypted storage
├── apps/
│   └── web/         # Control dashboard (coming soon)
└── scripts/         # Build and release scripts

## Security

OpenOcean is built security-first:

- Always binds to 127.0.0.1 — never exposed to the internet by default
- Allowlist-based access — only approved users can message your assistant
- Hard API spend limits — no surprise bills
- Full audit log — every event timestamped and recorded
- No telemetry — nothing phoned home
- MIT licensed — read every line

## Roadmap

- WhatsApp channel
- Slack channel
- Web control dashboard
- Spend dashboard with real-time cost tracking
- Session replay and time-travel debugging
- OpenOcean Hub — curated skill registry
- Incognito sessions — zero-log ephemeral mode

## License

MIT — do whatever you want with it.

## Contributing

Pull requests welcome. See CONTRIBUTING.md for guidelines.

Built by Ayush-3plus4 and contributors.