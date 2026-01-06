# Security Policy

## Supported Versions

We actively support the following versions with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |

## Reporting a Vulnerability

We take the security of this GitHub Action seriously. If you discover a security vulnerability, please follow these steps:

### How to Report

**Please do NOT report security vulnerabilities through public GitHub issues.**

Instead, please report them by:

1. Opening a [Security Advisory](https://github.com/RoyBkker/github-action-vercel-preview-url-poller/security/advisories/new) on GitHub
2. Or by emailing the maintainer directly (if contact information is available)

### What to Include

Please include as much of the following information as possible:

* **Type of vulnerability** (e.g., credential exposure, code injection, etc.)
* **Full paths** of source file(s) related to the vulnerability
* **Location** of the affected source code (tag/branch/commit)
* **Step-by-step instructions** to reproduce the issue
* **Proof-of-concept or exploit code** (if possible)
* **Impact** of the vulnerability
* **Suggested fix** (if you have one)

### What to Expect

* We will acknowledge your report within 48 hours
* We will provide a more detailed response within 5 business days
* We will keep you informed of the progress towards a fix
* We may ask for additional information or clarification

## Security Best Practices

When using this action in your workflows:

### Protect Your Secrets

* **Never** hardcode Vercel tokens or project IDs in your workflows
* Always use [GitHub Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets) for sensitive data:
  ```yaml
  with:
    vercel_token: ${{ secrets.VERCEL_TOKEN }}
    vercel_project_id: ${{ secrets.VERCEL_PROJECT_ID }}
  ```

### Use Specific Versions

* Pin to specific versions rather than using `@main`:
  ```yaml
  # Good
  uses: RoyBkker/github-action-vercel-preview-url-poller@v1.1.0

  # Less secure
  uses: RoyBkker/github-action-vercel-preview-url-poller@main
  ```

### Limit Token Permissions

* Create Vercel tokens with minimal required permissions
* Use project-scoped tokens when possible
* Regularly rotate your tokens

### Review Workflow Logs

* Be aware that URLs may appear in workflow logs
* Use [workflow log masking](https://docs.github.com/en/actions/using-workflows/workflow-commands-for-github-actions#masking-a-value-in-log) if needed
* Review logs for any unexpected behavior

## Known Security Considerations

### URL Exposure

This action outputs deployment URLs which may be visible in workflow logs. If you're deploying sensitive applications:

* Be cautious about who has access to your repository's Actions logs
* Consider using private repositories for sensitive projects
* Review your Vercel deployment settings for preview deployments

### API Token Security

* The Vercel API token has access to your Vercel account
* Ensure your repository's secret management is properly configured
* Limit who has write access to your repository

## Updates

We will announce security updates through:

* GitHub Security Advisories
* Release notes
* Repository README

Subscribe to repository releases to stay informed about security updates.
