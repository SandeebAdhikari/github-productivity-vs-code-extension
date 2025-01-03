import { exec } from "child_process";
import * as vscode from "vscode";
import { getChangeSummary } from "./watcher";

export function scheduleCommits(context: vscode.ExtensionContext) {
  // Schedule commits every 30 minutes
  setInterval(() => {
    // Generate the commit message based on changes
    const commitMessage = getChangeSummary();

    // Skip committing if no changes were detected
    if (!commitMessage) {
      console.log(
        "No significant changes in the last 30 minutes. Skipping commit."
      );
      return;
    }

    // Log the operation for debugging
    console.log("Scheduling commit with message:", commitMessage);

    // Execute Git commands
    exec(
      `git add . && git commit -m "${commitMessage}" && git push`,
      (error, stdout, stderr) => {
        if (error) {
          vscode.window.showErrorMessage(
            `Failed to commit and push: ${error.message}`
          );
          console.error("Commit error:", error.message);
          console.error("Commit stderr:", stderr);
        } else {
          vscode.window.showInformationMessage(
            `Changes committed successfully: ${commitMessage}`
          );
          console.log("Commit stdout:", stdout);
        }
      }
    );
  }, 30 * 60 * 1000); // Run every 30 minutes
}
