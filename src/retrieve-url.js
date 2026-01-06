const core = require("@actions/core");
const axios = require("axios");

/**
 * Retrieves the preview URL from Vercel for the current branch
 */
async function retrievePreviewUrl({
  token,
  teamId,
  projectId,
  matchPreviewUrl,
}) {
  const baseUrl = "https://api.vercel.com";

  // Get the current branch name from the GitHub context
  //   const branchName = github.context.ref.replace("refs/heads/", "");
  //   core.info(`Looking for deployments for branch: ${branchName}`);

  // Get the correct branch name from GitHub context
  // First check if a branch name override is provided
  const searchBranchName = process.env.SEARCH_BRANCH_NAME || "";

  // Determine the default branch name based on event type
  let defaultGithubBranch;
  if (
    process.env.GITHUB_EVENT_NAME === "pull_request" ||
    process.env.GITHUB_EVENT_NAME === "pull_request_target"
  ) {
    // For pull requests, use GITHUB_HEAD_REF (the source branch)
    defaultGithubBranch = process.env.GITHUB_HEAD_REF;
  } else {
    // For other events, use GITHUB_REF but strip off refs/heads/ prefix
    defaultGithubBranch = process.env.GITHUB_REF.replace("refs/heads/", "");
  }

  // Use the override if provided, otherwise use the default branch name
  const branchName =
    searchBranchName.length > 0 ? searchBranchName : defaultGithubBranch;

  core.info(`Looking for deployments for branch: ${branchName}`);

  // Set up headers with auth token
  const headers = {
    Authorization: `Bearer ${token}`,
  };

  // Build the API URL
  let apiUrl = `${baseUrl}/v6/deployments`;
  const params = new URLSearchParams({
    projectId: projectId,
    limit: "100",
  });

  if (teamId) {
    params.append("teamId", teamId);
  }

  apiUrl = `${apiUrl}?${params.toString()}`;

  // Make the API request
  const response = await axios.get(apiUrl, { headers });

  if (!response.data || !response.data.deployments) {
    throw new Error("No deployments found in Vercel response");
  }

  // Filter deployments by branch name (meta.githubCommitRef)
  const deployments = response.data.deployments.filter((deployment) => {
    return deployment.meta && deployment.meta.githubCommitRef === branchName;
  });

  if (deployments.length === 0) {
    throw new Error(`No deployments found for branch: ${branchName}`);
  }

  let deployment = undefined;

  // Try to find the deployment by matching the preview URL, if provided
  if (matchPreviewUrl) {
    // Remove the protocol prefix from the URL
    const exactMatch = matchPreviewUrl.startsWith("https://")
      ? matchPreviewUrl.slice(8)
      : matchPreviewUrl;

    // Try to find the deployment with the exact URL match
    deployment = deployments.find(
      (deployment) => deployment.url === exactMatch,
    );

    if (deployment === undefined) {
      console.warn(
        `No deployment found with exact URL match: ${exactMatch}. Falling back to most recent deployment.`,
      );
    }
  }

  // If no matching deployment is found, use the most recent deployment
  if (deployment === undefined) {
    // Sort by createdAt to get the most recent deployment
    deployments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    deployment = deployments[0];
  }

  return {
    url: deployment.url,
    deploymentId: deployment.uid,
    state: deployment.state,
    branchAlias: deployment.meta?.branchAlias,
  };
}

module.exports = { retrievePreviewUrl };
