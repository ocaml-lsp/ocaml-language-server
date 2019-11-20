import * as lodash from "lodash";
import * as LSP from "vscode-languageserver-protocol";
import { merlin } from "../../../lib";
import * as command from "../command";
import * as parser from "../parser";
import * as processes from "../processes";
import Session from "./index";

export default class Analyzer implements LSP.Disposable {
  public readonly refreshImmediate: (event: LSP.TextDocumentIdentifier) => Promise<void>;
  public readonly refreshDebounced: ((event: LSP.TextDocumentIdentifier) => Promise<void>) & lodash.Cancelable;
  private readonly bsbDiagnostics: { [key: string]: LSP.Diagnostic[] } = {};

  constructor(private readonly session: Session) {}

  public clear({ uri }: LSP.TextDocumentIdentifier): void {
    if (
      this.bsbDiagnostics[uri] == null ||
      this.bsbDiagnostics[uri][0] == null ||
      this.bsbDiagnostics[uri][0].source !== "bucklescript"
    ) {
      this.session.connection.sendDiagnostics({
        diagnostics: [],
        uri,
      });
    }
  }

  public dispose(): void {
    return;
  }

  public async initialize(): Promise<void> {
    this.onDidChangeConfiguration();
  }

  public onDidChangeConfiguration(): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this.refreshImmediate as any) = this.refreshWithKind(LSP.TextDocumentSyncKind.Full);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this.refreshDebounced as any) = lodash.debounce(
      this.refreshWithKind(LSP.TextDocumentSyncKind.Incremental),
      this.session.settings.reason.debounce.linter,
      { trailing: true },
    );
  }

  public refreshWithKind(syncKind: LSP.TextDocumentSyncKind): (id: LSP.TextDocumentIdentifier) => Promise<void> {
    return async (id): Promise<void> => {
      const tools: Set<string> = new Set(this.session.settings.reason.diagnostics.tools);
      if (tools.size < 1) return;

      // Reset state for every run. This currently can hide valid warnings in some cases
      // as they are not cached, but the alternative (trying to keep track of them) will
      // probably be worse. See https://github.com/BuckleScript/bucklescript/issues/2024
      Object.keys(this.bsbDiagnostics).forEach(fileUri => {
        this.bsbDiagnostics[fileUri] = [];
      });
      this.bsbDiagnostics[id.uri] = [];

      if (tools.has("bsb") && syncKind === LSP.TextDocumentSyncKind.Full) {
        this.refreshDebounced.cancel();
        const bsbProcess = new processes.BuckleScript(this.session);
        const bsbOutput = await bsbProcess.run();

        const diagnostics = parser.bucklescript.parseErrors(bsbOutput);
        Object.keys(diagnostics).forEach(fileUri => {
          if (!this.bsbDiagnostics[fileUri]) {
            this.bsbDiagnostics[fileUri] = [];
          }
          this.bsbDiagnostics[fileUri] = this.bsbDiagnostics[fileUri].concat(diagnostics[fileUri]);
        });

        Object.keys(this.bsbDiagnostics).forEach(fileUri => {
          this.session.connection.sendDiagnostics({
            diagnostics: this.bsbDiagnostics[fileUri],
            uri: fileUri,
          });
          if (this.bsbDiagnostics[fileUri].length === 0) {
            delete this.bsbDiagnostics[fileUri];
          }
        });
      } else if (tools.has("merlin")) {
        if (syncKind === LSP.TextDocumentSyncKind.Full) {
          const document = await command.getTextDocument(this.session, id);
          if (null != document) {
            await this.session.merlin.sync(merlin.Sync.tell("start", "end", document.getText()), id);
          }
        }
        this.session.cancelTokens("analyzer/refreshWithKind");
        const errors = await this.session.merlin.query(
          merlin.Query.errors(),
          this.session.cancellationSources["analyzer/refreshWithKind"].token,
          id,
        );
        if ("return" !== errors.class) return;
        const diagnostics: LSP.Diagnostic[] = [];
        for (const report of errors.value)
          diagnostics.push(await merlin.IErrorReport.intoCode(this.session, id, report));
        this.session.connection.sendDiagnostics({ diagnostics, uri: id.uri });
      }
    };
  }
}
