import * as vscode from "vscode";
import { Watcher } from "./watcher";
import { Scheduler } from "./scheduler";
import { GitHubAuth } from "./auth";

export async function activate(context: vscode.ExtensionContext) {
  const config = vscode.workspace.getConfiguration('activityTracker');
  const watcher = new Watcher();
  const githubAuth = new GitHubAuth();

  try {
    // Retrieve or request GitHub token
    let token = await context.secrets.get('githubToken');
    if (!token) {
      token = await vscode.window.showInputBox({ 
        prompt: "Enter GitHub Personal Access Token (repo scope required)",
        ignoreFocusOut: true
      });
      
      if (!token) {
        vscode.window.showErrorMessage("GitHub token is required for activity tracking");
        return;
      }
      await context.secrets.store('githubToken', token);
    }

    // Authenticate with GitHub
    await githubAuth.authenticate(token);

    // Get configuration values
    const repoName = config.get<string>('repoName', 'vscode-activity-tracker');
    const intervalMinutes = config.get<number>('intervalMinutes', 30);
    const isPrivateRepo = config.get<boolean>('repoPrivate', true);

    // Validate/Create repository
    await githubAuth.validateRepo(repoName, isPrivateRepo);

    // Initialize scheduler with all required parameters
    const scheduler = new Scheduler(
      watcher,
      githubAuth,
      repoName,  // Now passed as 3rd argument
      intervalMinutes
    );
    scheduler.start();

    // Register commands
    context.subscriptions.push(
      vscode.commands.registerCommand('activityTracker.stop', () => {
        scheduler.stop();
        vscode.window.showInformationMessage("Activity tracking stopped");
      }),
      vscode.commands.registerCommand('activityTracker.clearToken', async () => {
        await context.secrets.delete('githubToken');
        vscode.window.showInformationMessage("GitHub token cleared");
      })
    );

  } catch (error) {
    // Handle errors during activation
    let errorMessage = "Failed to initialize activity tracker";
    if (error instanceof Error) {
      errorMessage += `: ${error.message}`;
    }
    vscode.window.showErrorMessage(errorMessage);
    
    // Clear invalid token
    await context.secrets.delete('githubToken');
  }
}

export function deactivate() {
  // Cleanup handled through extension subscriptions
}
