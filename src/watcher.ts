import * as vscode from "vscode";

export class Watcher {
  private fileChanges: Map<string, { lastModified: Date; changes: string }> = new Map();

  constructor() {
    const watcher = vscode.workspace.createFileSystemWatcher("**/*");
    
    watcher.onDidChange((uri) => this.recordChange(uri, "Modified"));
    watcher.onDidCreate((uri) => this.recordChange(uri, "Created"));
    watcher.onDidDelete((uri) => this.recordChange(uri, "Deleted"));
  }

  private recordChange(uri: vscode.Uri, changeType: string) {
    const timestamp = new Date();
    const relativePath = vscode.workspace.asRelativePath(uri);

    this.fileChanges.set(relativePath, {
      lastModified: timestamp,
      changes: changeType,
    });
  }

  getChanges() {
    return Array.from(this.fileChanges.entries()).map(([file, details]) => ({
      file,
      ...details,
    }));
  }

  clearChanges() {
    this.fileChanges.clear();
  }
}
