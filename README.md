# Vercel Preview URL with Status Polling GitHub Action

A reliable GitHub Action that retrieves Vercel preview deployment URLs and actively polls the deployment status until your Vercel preview environment is fully ready before proceeding with your CI/CD workflow.

## 🚀 Key Benefits

- **No Deployment Status Event Required**: Unlike traditional methods that rely on GitHub's `deployment_status` event, this action actively polls Vercel's API for real-time status updates. This means:

  - Works with any Vercel deployment workflow
  - No need to configure special deployment hooks
  - More reliable than webhook-based solutions
  - Can be used with both preview and production deployments
  - Compatible with custom deployment configurations

- **Prevent Flaky E2E Tests**: Ensures your end-to-end tests or integration tests don't run against partially-deployed Vercel previews
- **Reliable CI/CD Automation**: Only proceed when your Vercel preview deployment is actually ready to be used
- **Branch Alias Support**: Automatically get both the standard Vercel preview URL and branch alias URL (if configured)
- **Configurable Timeout Settings**: Set custom polling intervals and maximum wait times for deployment completion
- **Flexible Deployment Status Handling**: Define your own success/failure deployment states for custom workflows

## 🔍 How It Works

This GitHub Action performs three key operations in your CI/CD pipeline:

1. **Retrieves the latest Vercel deployment** for your project and branch using the Vercel API
2. **Extracts the preview URL and deployment ID** from the Vercel deployment data
3. **Polls the Vercel deployment status API** until the deployment reaches a ready state (or times out)

## 📋 Usage Examples

### Example 1: Basic Pull Request Workflow

```yaml
jobs:
  deploy-and-test:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      # Your Vercel deployment step here...

      - name: Get Vercel Preview URL and wait for deployment
        uses: RoyBkker/github-action-vercel-preview-url-poller@v1
        id: vercel_deployment
        with:
          vercel_token: ${{ secrets.VERCEL_TOKEN }}
          vercel_project_id: "prj_your_project_id"
          max_timeout: 300 # 5 minutes max timeout
          polling_interval: 5 # Check deployment status every 5 seconds
          deployment_ready_states: "READY,CANCELED"
          deployment_error_states: "ERROR"

      - name: Run E2E tests against ready Vercel preview
        run: |
          # Now you can be confident the Vercel preview is fully deployed and ready
          echo "Vercel Preview URL: ${{ steps.vercel_deployment.outputs.preview_url }}"
          echo "Vercel Branch Alias: ${{ steps.vercel_deployment.outputs.branch_alias }}"

          # Run your E2E tests, Playwright tests, or Cypress tests here
          npm run test:e2e -- --baseUrl=${{ steps.vercel_deployment.outputs.preview_url }}
```

### Example 2: Multi-Project / Monorepo Production Testing Workflow

This example demonstrates how to use the action in a workflow that tests multiple applications in Vercel in a monorepo after deploying to production.

```yaml
name: Production Release Tests
description: Automated end-to-end and accessibility testing workflow for multiple applications after production deployments

on:
  push:
    branches:
      - "main"
    paths:
      - "apps/**"

jobs:
  # Get URLs for the first application
  get-app1-production-url:
    timeout-minutes: 10
    runs-on: ubuntu-latest
    outputs:
      url: ${{ steps.production_url.outputs.preview_url }}
    steps:
      - uses: actions/checkout@v4
      - name: Get app1 production URL
        id: production_url
        uses: RoyBkker/github-action-vercel-preview-url-poller@v1
        with:
          vercel_token: ${{ secrets.VERCEL_TOKEN }}
          vercel_project_id: ${{ secrets.VERCEL_PROJECT_ID_APP1 }} # Only need for a different project id
          vercel_team_id: ${{ secrets.VERCEL_TEAM_ID }}
          max_timeout: 600 # 10 minutes max timeout for production builds
      - name: Display production URL
        run: echo "app1 production URL - https://${{ steps.production_url.outputs.preview_url }}"
        shell: bash

  # Get URLs for the second application
  get-app2-production-url:
    timeout-minutes: 10
    runs-on: ubuntu-latest
    outputs:
      url: ${{ steps.production_url.outputs.preview_url }}
    steps:
      - uses: actions/checkout@v4
      - name: Get app2 production URL
        id: production_url
        uses: RoyBkker/github-action-vercel-preview-url-poller@v1
        with:
          vercel_token: ${{ secrets.VERCEL_TOKEN }}
          vercel_project_id: ${{ secrets.VERCEL_PROJECT_ID_APP2 }} # Only need for a different project id
          vercel_team_id: ${{ secrets.VERCEL_TEAM_ID }}
          max_timeout: 600 # 10 minutes max timeout for production builds
      - name: Display production URL
        run: echo "app2 production URL - https://${{ steps.production_url.outputs.preview_url }}"
        shell: bash

  # Run E2E tests for the first application
  e2e-tests-app1:
    timeout-minutes: 30
    needs: [get-app1-production-url]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "18"

      - name: Install dependencies
        working-directory: apps/app1
        run: npm install

      - name: Install Playwright dependencies
        working-directory: apps/app1
        run: npx playwright install --with-deps chromium

      - name: Run E2E tests
        working-directory: apps/app1
        run: npx playwright test tests/e2e
        env:
          PLAYWRIGHT_TEST_BASE_URL: https://${{ needs.get-app1-production-url.outputs.url }}

      - name: Upload test results
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report-app1
          path: apps/app1/playwright-report/
        if: always()

  # Run E2E tests for the second application
  e2e-tests-app2:
    timeout-minutes: 30
    needs: [get-app2-production-url]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "18"

      - name: Install dependencies
        working-directory: apps/app2
        run: npm install

      - name: Install Playwright dependencies
        working-directory: apps/app2
        run: npx playwright install --with-deps chromium

      - name: Run E2E tests
        working-directory: apps/app2
        run: npx playwright test tests/e2e
        env:
          PLAYWRIGHT_TEST_BASE_URL: https://${{ needs.get-app2-production-url.outputs.url }}

      - name: Upload test results
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report-app2
          path: apps/app2/playwright-report/
        if: always()
```

## 🔧 Advanced Features

- **Active Status Polling**: Continuously monitors Vercel deployment progress, rather than just retrieving the URL once
- **Custom Deployment States**: Customize which Vercel deployment states are considered "ready" or "error" states
- **Team Project Support**: Works with team-based Vercel projects through the optional `vercel_team_id` parameter
- **Comprehensive Error Handling**: Clear error messages when Vercel deployments fail or timeout
- **Pull Request Detection**: Automatically detects the correct branch for pull request deployments
- **GitHub Integration**: Uses GitHub context to determine the correct branch for deployment search
- **Production Deployment Testing**: Works for both preview deployments and production deployments

## ⚙️ Input Parameters

| Name                      | Description                                                  | Required | Default |
| ------------------------- | ------------------------------------------------------------ | -------- | ------- |
| `vercel_token`            | Vercel API authentication token                              | Yes      | -       |
| `vercel_team_id`          | Vercel team ID for team projects                             | No       | -       |
| `vercel_project_id`       | Vercel project ID to check deployments                       | Yes      | -       |
| `match_preview_url`       | Exact string to match the preview URL                        | No       | -       |
| `max_timeout`             | Maximum timeout in seconds for polling                       | No       | 300     |
| `polling_interval`        | Interval between status checks in seconds                    | No       | 5       |
| `deployment_ready_states` | Vercel deployment states considered ready (comma-separated)  | No       | 'READY' |
| `deployment_error_states` | Vercel deployment states considered errors (comma-separated) | No       | 'ERROR' |

## 📤 Output Values

| Name               | Description                                 |
| ------------------ | ------------------------------------------- |
| `preview_url`      | The URL of the Vercel preview deployment    |
| `deployment_state` | Current state of the Vercel deployment      |
| `branch_alias`     | Branch alias URL from Vercel (if available) |

## 🔐 Finding Your Vercel Configuration Values

### Vercel Project ID

1. Go to your Vercel dashboard
2. Select your project
3. Go to Project Settings
4. The Project ID is listed under the "General" section

### Vercel Team ID

1. If using a team project, check the URL when viewing your team
2. The format is typically: `https://vercel.com/teams/[team-slug]/[team-id]`

### Vercel Token

1. Go to your Vercel account settings
2. Navigate to Tokens
3. Create a new token with appropriate permissions

## 🔄 Common CI/CD Integration Scenarios

- **Next.js E2E Testing**: Ensure your Next.js app is fully deployed before running Playwright or Cypress tests
- **React App Validation**: Test your React application on a live preview before merging
- **Documentation Site Deployment**: Verify your documentation site deploys correctly before proceeding
- **Visual Regression Testing**: Run visual comparison tests against a fully deployed preview
- **Multi-App Testing**: Test multiple applications within the same workflow after production deployments
- **Accessibility Compliance**: Run accessibility tests against production deployments
- **Continuous Monitoring**: Implement post-deployment testing for production releases

## 📄 License

MIT

## 👨‍💻 Author

Roy Bakker
