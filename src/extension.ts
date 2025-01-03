import * as vscode from "vscode";
import { authenticateWithGitHub } from "./auth";
import { startFileWatcher } from "./watcher";
import { scheduleCommits } from "./scheduler";
import { Octokit } from "@octokit/rest";

export async function activate(context: vscode.ExtensionContext) {
  vscode.window.showInformationMessage(
    "GitHub Productivity Extension Activated!"
  );

  // Command to initialize the code-tracking repository
  const initRepoCommand = vscode.commands.registerCommand(
    "extension.initRepo",
    async () => {
      try {
        // Authenticate the user
        const token = await authenticateWithGitHub();
        if (!token) {
          vscode.window.showErrorMessage("GitHub authentication failed.");
          return;
        }

        const octokit = new Octokit({ auth: token });

        // Automatically create a new repository
        const repoName = "code-tracking";
        vscode.window.showInformationMessage(
          `Creating repository '${repoName}' on GitHub...`
        );

        const response = await octokit.repos.createForAuthenticatedUser({
          name: repoName,
          private: true,
          auto_init: true,
        });

        const repoUrl = response.data.ssh_url;
        vscode.window.showInformationMessage(`Repository created: ${repoUrl}`);

        // Initialize the repository locally and set up the remote
        const terminal = vscode.window.createTerminal("Git Init");
        terminal.show();
        terminal.sendText(`git init && git remote add origin ${repoUrl}`);
      } catch (error: unknown) {
        if (error instanceof Error) {
          vscode.window.showErrorMessage(
            `Failed to create repository: ${error.message}`
          );
        } else {
          vscode.window.showErrorMessage(
            "An unknown error occurred while creating the repository."
          );
        }
      }
    }
  );

  context.subscriptions.push(initRepoCommand);

  // Start file watcher
  startFileWatcher(context);

  // Start commit scheduler
  scheduleCommits(context);
}

export function deactivate() {
  vscode.window.showInformationMessage(
    "GitHub Productivity Extension Deactivated!"
  );
}
