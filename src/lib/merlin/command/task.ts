import * as LSP from "vscode-languageserver-protocol";

export class Task<I> {
  constructor(
    readonly task: I | { context: ["auto", string]; query: I },
    readonly token: LSP.CancellationToken | null = null,
    readonly enqueuedAt: Date = new Date(),
  ) {}
}
