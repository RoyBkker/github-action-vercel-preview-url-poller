const core = require("@actions/core");
const { retrievePreviewUrl } = require("./retrieve-url");
const { pollDeploymentStatus } = require("./poll-status");

async function run() {
  try {
    // Get inputs
    const token = core.getInput("vercel_token", { required: true });
    const teamId = core.getInput("vercel_team_id");
    const projectId = core.getInput("vercel_project_id", { required: true });
    const matchPreviewUrl = core.getInput("match_preview_url");
    const maxTimeout = parseInt(core.getInput("max_timeout"), 10);
    const pollingInterval = parseInt(core.getInput("polling_interval"), 10);
    const readyStates = core.getInput("deployment_ready_states").split(",");
    const errorStates = core.getInput("deployment_error_states").split(",");

    core.info("Retrieving Vercel preview URL...");

    // First, retrieve the preview URL and initial state
    const { url, deploymentId, state, branchAlias } = await retrievePreviewUrl({
      token,
      teamId,
      projectId,
      matchPreviewUrl,
    });

    if (!url || !deploymentId) {
      throw new Error("Failed to retrieve deployment information");
    }

    core.info(`Found preview URL: ${url}`);
    core.info(`Current deployment state: ${state}`);

    if (branchAlias) {
      core.info(`Branch alias: ${branchAlias}`);
    }

    // Set outputs for the initial URL and state
    core.setOutput("preview_url", url);
    core.setOutput("deployment_state", state);

    if (branchAlias) {
      core.setOutput("branch_alias", branchAlias);
    }

    // If the deployment is already in a ready state, we're done
    if (readyStates.includes(state)) {
      core.info("Deployment is already ready!");
      return;
    }

    // If the deployment is in an error state, fail the action
    if (errorStates.includes(state)) {
      throw new Error(`Deployment is in error state: ${state}`);
    }

    // Otherwise, start polling for status until ready
    core.info("Starting to poll for deployment status...");
    const finalState = await pollDeploymentStatus({
      token,
      teamId,
      deploymentId,
      maxTimeout,
      pollingInterval,
      readyStates,
      errorStates,
    });

    core.info(`Final deployment state: ${finalState}`);
    core.setOutput("deployment_state", finalState);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
