import * as vscode from "vscode";

export async function authenticateWithGitHub(): Promise<string | null> {
  try {
    // Ask the user to sign in with GitHub
    const session = await vscode.authentication.getSession("github", ["repo"], {
      createIfNone: true,
    });

    if (session) {
      return session.accessToken; // Return the access token for GitHub API requests
    } else {
      vscode.window.showErrorMessage("Failed to authenticate with GitHub.");
      return null;
    }
  } catch (error) {
    if (error instanceof Error) {
      vscode.window.showErrorMessage(
        `GitHub authentication error: ${error.message}`
      );
    } else {
      vscode.window.showErrorMessage(
        `GitHub authentication failed with an unknown error.`
      );
    }
    return null;
  }
}
