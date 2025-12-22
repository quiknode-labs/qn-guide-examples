# Quicknode Sample Apps and Code Examples

> The official code repository for Quicknode Sample Apps and Code Examples.

[![GitHub Stars](https://img.shields.io/github/stars/quiknode-labs/qn-guide-examples?logo=github&style=for-the-badge)](https://github.com/quiknode-labs/qn-guide-examples/stargazers)
[![License](https://img.shields.io/github/license/quiknode-labs/qn-guide-examples?style=for-the-badge)](LICENSE)
[![Follow on X](https://img.shields.io/twitter/follow/quicknode?label=Follow%20Quicknode&style=for-the-badge)](https://x.com/quicknode)

If this repo helps you ship faster, please ⭐ it to support the community.

## Quick Links

- [Sample App Library](https://www.quicknode.com/sample-app-library) (deployable apps)
- [Quicknode Guides](https://www.quicknode.com/guides) (step-by-step tutorials)

## Table of Contents

- [What’s in This Repo](#whats-in-this-repo)
- [How to Use This Repo](#how-to-use-this-repo)
- [Getting Started](#getting-started)
- [Contributing](#contributing)
- [Community & Support](#community--support)

## What’s in This Repo

This repository powers Quicknode’s technical guides and tutorials. It includes:

- **Sample App Library**: Full-stack, deployable apps (Next.js, React, etc.) that mirror what you see in the Sample App Library. Look for folders like `sample-dapps/` and other framework-specific directories.
- **Guide Examples**: Smaller, focused examples, backend scripts, and snippets that pair with Quicknode Guides (e.g., `ethereum/`, `solana/`, `binance/`, `webhooks/`, and more).

Each sub-folder has its own README with framework/runtime details, env vars, and run commands tailored to that example.

## How to Use This Repo

1. Pick the folder that matches the guide or demo you’re following.
2. Open that folder’s `README.md` for exact setup and runtime instructions.
3. Copy the required environment variables into a local `.env` file.
4. Run the example locally, adapt it for your stack, or use it as a starting point for your own app.

## Getting Started

General steps (specifics live in each example’s README):

```bash
git clone https://github.com/quiknode-labs/qn-guide-examples.git
cd qn-guide-examples/<example-folder>
# Install dependencies for the chosen runtime (e.g., npm install, yarn, pip, go mod download)
cp .env.example .env    # if provided
# Update .env with your Quicknode endpoint keys and any required secrets
```

## Contributing

We welcome fixes, new examples, and improvements:

- Open an issue or PR for bugs, documentation gaps, or new language/framework samples.
- Include a clear `README.md` in your example folder; `TEMPLATE_README.md` at the repo root can guide you.
- Keep instructions reproducible and note any prerequisites unique to your example.

## Community & Support

- Join the Quicknode Discord for questions and collaboration: https://discord.gg/quicknode
- Repo-specific bugs or requests: open a GitHub issue so we can track it.
- Need help with Quicknode products? Reach out via support: https://support.quicknode.com/

Thanks for building with Quicknode and don’t forget to ⭐ the repo if it’s useful!
