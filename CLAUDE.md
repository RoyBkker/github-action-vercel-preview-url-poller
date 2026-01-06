# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a GitHub Action that retrieves Vercel preview deployment URLs and actively polls deployment status until ready. Unlike traditional webhook-based approaches, this action uses active polling of Vercel's API to ensure deployments are fully ready before proceeding with CI/CD workflows.

## Core Architecture

The action follows a modular architecture with three main components:

1. **Entry point** (`src/index.js`): Orchestrates the workflow by retrieving inputs from action.yml, calling the URL retrieval module, then polling for deployment status. Sets GitHub Action outputs and handles errors.

2. **URL Retrieval** (`src/retrieve-url.js`): Fetches the latest Vercel deployment for a specific branch using the Vercel API v6 deployments endpoint. Key logic:
   - Automatically detects branch name based on GitHub event type (pull requests use `GITHUB_HEAD_REF`, other events use `GITHUB_REF`)
   - Supports optional `SEARCH_BRANCH_NAME` environment variable override
   - Filters deployments by `meta.githubCommitRef` to match the branch
   - Returns the most recent deployment by sorting on `createdAt` timestamp
   - Returns: `url`, `deploymentId`, `state`, and optional `branchAlias`

3. **Status Polling** (`src/poll-status.js`): Polls the Vercel API v13 deployments endpoint at configurable intervals until the deployment reaches a ready or error state, or times out. Implements exponential backoff-like behavior through configurable polling intervals.

## Branch Detection Logic

The action has special handling for pull request events:
- Pull request events (`pull_request`, `pull_request_target`): Uses `GITHUB_HEAD_REF` (source branch)
- All other events: Uses `GITHUB_REF` with `refs/heads/` prefix stripped
- Override: Set `SEARCH_BRANCH_NAME` environment variable to force a specific branch

This is critical for proper deployment matching in PR workflows.

## Development Commands

```bash
# Install dependencies
pnpm install

# Build the action (compiles src/ into dist/index.js using @vercel/ncc)
npm run build

# Run tests
npm test

# Prepare for release (builds automatically)
npm run prepare
```

## Testing the Action

Since this is a GitHub Action, testing typically requires:
1. Building the action: `npm run build`
2. Creating a test workflow in `.github/workflows/` that uses the action
3. Testing in an actual GitHub repository with Vercel deployments

The action requires these secrets/inputs:
- `vercel_token`: Vercel API token (required)
- `vercel_project_id`: Vercel project ID (required)
- `vercel_team_id`: Vercel team ID (optional, for team projects)

## Vercel API Endpoints

The action uses two Vercel API endpoints:
- **List deployments**: `GET /v6/deployments?projectId={id}&limit=100` - retrieves deployments for a project
- **Get deployment**: `GET /v13/deployments/{deploymentId}` - polls single deployment status

Both require Bearer token authentication via `Authorization` header.

## Deployment States

The action recognizes configurable deployment states:
- **Ready states** (default: `READY`): Deployment is fully ready
- **Error states** (default: `ERROR`): Deployment failed
- **In-progress states**: Any other state triggers continued polling

These can be customized via `deployment_ready_states` and `deployment_error_states` inputs (comma-separated).

## Building and Releasing

The action uses `@vercel/ncc` to compile all dependencies into a single `dist/index.js` file. This bundled file is what GitHub Actions executes. Always run `npm run build` before committing changes to ensure `dist/` is up to date.

The `action.yml` specifies `node20` as the runtime and points to `dist/index.js` as the entry point.
