import * as vscode from "vscode";

const changeLog: { added: string[]; modified: string[]; deleted: string[] } = {
  added: [],
  modified: [],
  deleted: [],
};

export function startFileWatcher(context: vscode.ExtensionContext) {
  const watcher = vscode.workspace.createFileSystemWatcher("**/*");

  console.log("File watcher activated");

  watcher.onDidCreate((uri) => {
    console.log(`File created: ${uri.fsPath}`);
    if (!changeLog.added.includes(uri.fsPath)) {
      changeLog.added.push(uri.fsPath);
    }
  });

  watcher.onDidChange((uri) => {
    console.log(`File modified: ${uri.fsPath}`);
    if (!changeLog.modified.includes(uri.fsPath)) {
      changeLog.modified.push(uri.fsPath);
    }
  });

  watcher.onDidDelete((uri) => {
    console.log(`File deleted: ${uri.fsPath}`);
    if (!changeLog.deleted.includes(uri.fsPath)) {
      changeLog.deleted.push(uri.fsPath);
    }
  });

  return watcher;
}

export function getChangeSummary(): string {
  const summary: string[] = [];

  if (changeLog.added.length > 0) {
    summary.push(`Added: ${changeLog.added.join(", ")}`);
  }
  if (changeLog.modified.length > 0) {
    summary.push(`Modified: ${changeLog.modified.join(", ")}`);
  }
  if (changeLog.deleted.length > 0) {
    summary.push(`Deleted: ${changeLog.deleted.join(", ")}`);
  }

  // Clear the log after generating the summary
  changeLog.added = [];
  changeLog.modified = [];
  changeLog.deleted = [];

  return summary.join(" | ");
}
