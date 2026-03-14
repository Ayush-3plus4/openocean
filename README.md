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