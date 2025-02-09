import * as vscode from "vscode";
import { Watcher } from "./watcher";
import { GitHubAuth } from "./auth";

export class Scheduler {
  private watcher: Watcher;
  private githubAuth: GitHubAuth;
  private interval: NodeJS.Timeout | null = null;
  private repoName: string;
  private intervalMinutes: number;

  constructor(watcher: Watcher, githubAuth: GitHubAuth, repoName: string, intervalMinutes: number) {
    this.watcher = watcher;
    this.githubAuth = githubAuth;
    this.repoName = repoName;
    this.intervalMinutes = intervalMinutes;
  }

  start() {
    this.interval = setInterval(() => this.pushChanges(), this.intervalMinutes * 60 * 1000);
  }

  stop() {
    this.interval && clearInterval(this.interval);
  }

  private async pushChanges() {
  const changes = this.watcher.getChanges();
  if (changes.length === 0) return;

  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    try {
      const updateContent = this.generateUpdateTable(changes);
      await this.githubAuth.pushChanges(this.repoName, updateContent);
      this.watcher.clearChanges();
      return;
    } catch (error) {
      attempts++;
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Unknown error occurred';

      if (attempts === maxAttempts) {
        vscode.window.showErrorMessage(
          `Failed to push changes after ${maxAttempts} attempts: ${errorMessage}`
        );
      } else {
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }
  }

  private generateUpdateTable(changes: any[]) {
  const timestamp = new Date().toISOString();
  const header = `## Changes at ${timestamp}\n` + 
                 "| File | Last Modified | Change Type |\n" +
                 "| ---- | ------------- | ----------- |\n";
  
  const rows = changes.map(
    (change) => `| ${change.file} | ${change.lastModified.toISOString()} | ${change.changes} |`
  ).join("\n");

  return `${header}${rows}\n\n`; // Append to existing content
 }
}

