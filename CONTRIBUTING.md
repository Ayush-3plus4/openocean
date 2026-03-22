# Contributing to OpenOcean

First off — thank you for considering contributing! OpenOcean is a community
project and every contribution matters, whether it's a bug fix, a new channel
adapter, a new AI provider, or just improving the docs.

## Before you start

- Check the open issues: https://github.com/Ayush-3plus4/openocean/issues
- If you want to build something big, open an issue first so we can discuss it
- All contributions must be malware-free and respect user privacy

## Project structure

    openocean/
    ├── packages/
    │   ├── gateway/     # WebSocket control plane — core message routing
    │   ├── agent/       # AI runtime — add new providers here
    │   ├── channels/    # Messaging adapters — add new channels here
    │   ├── cli/         # Onboarding wizard
    │   └── storage/     # Spend tracking and local storage
    ├── apps/
    │   └── web/         # Real-time dashboard

## How to run locally

    git clone https://github.com/Ayush-3plus4/openocean.git
    cd openocean
    pnpm install
    cd packages/cli
    node --experimental-strip-types src/index.ts onboard
    cd ../gateway
    pnpm dev

## Adding a new AI provider

1. Open packages/agent/src/providers.ts
2. Add a new adapter implementing the ProviderAdapter interface
3. Open packages/agent/src/models.ts and add your model definitions
4. Open packages/agent/src/agent.ts and register the adapter in getAdapter()
5. Test it with the mock provider first

Example adapter structure:

    export const myProviderAdapter: ProviderAdapter = {
      async complete(request, apiKey) {
        const res = await fetch('https://api.myprovider.com/chat', {
          method: 'POST',
          headers: { 'Authorization': 'Bearer ' + apiKey },
          body: JSON.stringify({ model: request.model.modelId, messages: request.messages }),
        })
        const data = await res.json()
        return {
          content: data.choices[0].message.content,
          inputTokens: data.usage.input_tokens,
          outputTokens: data.usage.output_tokens,
          totalTokens: data.usage.total_tokens,
          model: request.model.modelId,
          provider: 'myprovider',
        }
      }
    }

## Adding a new channel

1. Open packages/channels/src/ and create your-channel.ts
2. Implement the channel class with a start() method
3. Export it from packages/channels/src/index.ts
4. Wire it into packages/gateway/src/index.ts
5. Add the config to the onboarding wizard in packages/cli/src/onboard.ts

## Pull request checklist

- Code follows the existing TypeScript style
- No optional chaining (?.) — use explicit ternary checks instead
- No emoji in console.log strings
- No hardcoded paths — use resolve() and process.cwd()
- Test with the mock provider before submitting
- Update README.md if you add a new feature

## Code style

- TypeScript strict mode
- No any types unless absolutely necessary
- Functions over classes where possible
- Clear variable names — no abbreviations
- Comments explain WHY not WHAT

## Security rules

- Never log API keys or tokens
- Never bind to 0.0.0.0 without explicit user consent
- All user input must be validated before processing
- New skills must go through the review process (coming soon)

## Questions?

Open an issue or start a discussion on GitHub. I'm friendly!