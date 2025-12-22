# Contributing to Quicknode Sample Apps and Guide Code Examples

Thank you for your interest in contributing! This repository contains sample applications and code examples that accompany Quicknode's [technical guides](https://quicknode.com/guides) and the [sample app library](https://www.quicknode.com/sample-app-library).

We welcome contributions from the community to help expand and improve these examples.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/)
- [Git](https://git-scm.com/)

### Setup

1. Fork and clone the repository:

```bash
git clone https://github.com/quiknode-labs/qn-guide-examples.git
cd qn-guide-examples
```

2. Install the pre-commit hook for automatic directory updates:

```bash
ln -s ../../scripts/pre-commit-tree.sh .git/hooks/pre-commit
```

## Adding a New Example

### 1. Choose the Right Location

Place your example in the appropriate category folder. If no category fits, create a new folder or open an issue to discuss.

### 2. Create Your Project

```bash
mkdir -p category/your-project-name
cd category/your-project-name
```

### 3. Add Required Files

Every project **should** include:

#### README.md

Use [TEMPLATE_README.md](./TEMPLATE_README.md) as your starting point. Include:

- Clear title (as `# Title` on the first line)
- Brief description of what the example demonstrates
- Prerequisites
- Step-by-step setup instructions
- How to run the example
- Link to the related Quicknode guide (if applicable)

#### package.json (for Node.js examples)

If applicable, include a `description` field (this appears in the project directory):

```json
{
  "name": "your-project-name",
  "version": "1.0.0",
  "description": "Brief one-line description of what this example does"
}
```

### 4. Code Guidelines

- **Keep examples focused** - Demonstrate one concept well rather than everything at once
- **Use environment variables** - Never commit API keys or secrets
- **Include a `.env.example`** - Show required environment variables
- **Add comments** - Explain non-obvious code, especially blockchain-specific logic
- **Test your example** - Ensure it works with a fresh clone

### 5. Commit Your Changes

When you commit, the pre-commit hook automatically updates the project directory in [README.md](./README.md). This ensures the directory is always up-to-date.

```bash
git add .
git commit -m "Add example for XYZ"
```

If the directory was updated, you'll be prompted to stage the changes:

```bash
git add README.md
git commit -m "Add example for XYZ"
```

## Updating an Existing Example

1. Make your changes
2. Update the README if behavior changed
3. Test the example still works
4. Submit a pull request with a clear description of changes

## Pull Request Guidelines

- **One example per PR** - Makes review easier
- **Clear PR title** - e.g., "Add Uniswap V4 swap example"
- **Link related issues** - If applicable
- **Test locally** - Ensure the example runs successfully

## Project Directory

The project directory in README.md is auto-generated. **Do not edit it manually.** 

To update the project directory, run:

```bash
npm run generate-directory
```

The directory pulls:
- **Title** from the first `# Heading` in your README.md
- **Description** from `package.json`'s `description` field

Optional: Install the pre-commit hook to update automatically on each commit:

```bash
ln -s ../../scripts/pre-commit-tree.sh .git/hooks/pre-commit
```

## Reporting Issues

Found a bug or have a suggestion?

- **Bugs**: Open an issue with steps to reproduce
- **New example ideas**: Open an issue to discuss before implementing
- **Documentation gaps**: PRs welcome!

## Code of Conduct

Be respectful and constructive. We're all here to learn and build.

## Questions?

- Check [Quicknode Docs](https://www.quicknode.com/docs)
- Join the [Quicknode Discord](https://discord.gg/quicknode)
- Open a GitHub issue

---

Thank you for contributing! 🚀