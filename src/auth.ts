import { Octokit } from "@octokit/rest";
import * as vscode from "vscode";

export class GitHubAuth {
  private octokit: Octokit | null = null;
  private username: string = "";

  async authenticate(token: string) {
    try {
      this.octokit = new Octokit({ auth: token });
      const { data: user } = await this.octokit.users.getAuthenticated();
      this.username = user.login;
    } catch (error) {
      let message = "Authentication failed";
      if (error instanceof Error) message += `: ${error.message}`;
      throw new Error(message);
    }
  }

  async validateRepo(repoName: string, isPrivate: boolean) {
    if (!this.octokit) throw new Error("Not authenticated");

    try {
      await this.octokit.repos.get({
        owner: this.username,
        repo: repoName,
      });
    } catch (error) {
      if (this.isOctokitError(error) && error.status === 404) {
        await this.octokit.repos.createForAuthenticatedUser({
          name: repoName,
          private: isPrivate,
        });
      } else {
        throw new Error(this.getErrorMessage(error, "Repository validation failed"));
      }
    }
  }

  async pushChanges(repoName: string, newContent: string) {
    if (!this.octokit) throw new Error("Not authenticated");

    const branch = "main";
    const fileName = "activity-log.md";

    try {
      const { data: existingFile } = await this.octokit.repos.getContent({
        owner: this.username,
        repo: repoName,
        path: fileName,
        ref: branch,
      });

      const existingContent = Buffer.from(
        (existingFile as any).content, "base64"
      ).toString("utf-8");
      
      const updatedContent = existingContent + newContent;

      await this.octokit.repos.createOrUpdateFileContents({
        owner: this.username,
        repo: repoName,
        path: fileName,
        message: `Update activity log at ${new Date().toISOString()}`,
        content: Buffer.from(updatedContent).toString("base64"),
        sha: (existingFile as any).sha,
        branch,
      });

    } catch (error) {
      if (this.isOctokitError(error) && error.status === 404) {
        await this.octokit.repos.createOrUpdateFileContents({
          owner: this.username,
          repo: repoName,
          path: fileName,
          message: "Initial activity log",
          content: Buffer.from(newContent).toString("base64"),
          branch,
        });
      } else {
        throw new Error(this.getErrorMessage(error, "Failed to push changes"));
      }
    }
  }

  private isOctokitError(error: any): error is { status: number } {
    return typeof error === "object" && error !== null && "status" in error;
  }

  private getErrorMessage(error: unknown, defaultMessage: string): string {
    if (error instanceof Error) return error.message;
    if (typeof error === "string") return error;
    return defaultMessage;
  }
}
