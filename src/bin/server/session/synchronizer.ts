import * as LSP from "vscode-languageserver-protocol";
import { merlin } from "../../../lib";
import Session from "./index";

export default class Synchronizer implements LSP.Disposable {
  public readonly documents: Map<string, LSP.TextDocument> = new Map();

  constructor(private readonly session: Session) {}

  public dispose(): void {
    return;
  }

  public async initialize(): Promise<void> {
    return;
  }

  public listen(): void {
    this.session.connection.onDidCloseTextDocument(this.onDidCloseTextDocument.bind(this));
    this.session.connection.onDidOpenTextDocument(this.onDidOpenTextDocument.bind(this));
    this.session.connection.onDidChangeTextDocument(this.onDidChangeTextDocument.bind(this));
    this.session.connection.onDidSaveTextDocument(this.onDidSaveTextDocument.bind(this));
  }

  public onDidChangeConfiguration(): void {
    return;
  }

  public getTextDocument(uri: string): null | LSP.TextDocument {
    const document = this.documents.get(uri);
    return document ? document : null;
  }

  private applyChangesToTextDocumentContent(
    oldDocument: LSP.TextDocument,
    change: LSP.TextDocumentContentChangeEvent,
  ): null | string {
    if (null == change.range) return null;
    const startOffset = oldDocument.offsetAt(change.range.start);
    const endOffset = oldDocument.offsetAt(change.range.end);
    const before = oldDocument.getText().substr(0, startOffset);
    const after = oldDocument.getText().substr(endOffset);
    return `${before}${change.text}${after}`;
  }

  private async doFullSync(
    document: LSP.VersionedTextDocumentIdentifier,
    languageId: string,
    content: string,
  ): Promise<void> {
    const version = document.version ? document.version : 0;
    const textDocument = LSP.TextDocument.create(document.uri, languageId, version, content);
    this.documents.set(document.uri, textDocument);
    const request = merlin.Sync.tell("start", "end", content);
    await this.session.merlin.sync(request, document);
  }

  private async doIncrementalSync(
    oldDocument: LSP.TextDocument,
    newDocument: LSP.VersionedTextDocumentIdentifier,
    change: LSP.TextDocumentContentChangeEvent,
  ): Promise<void> {
    if (null == change || null == change.range) {
      return;
    }

    const newContent = this.applyChangesToTextDocumentContent(oldDocument, change);
    if (null != newContent) {
      const version = newDocument.version ? newDocument.version : 0;
      const newTextDocument = LSP.TextDocument.create(oldDocument.uri, oldDocument.languageId, version, newContent);
      this.documents.set(newDocument.uri, newTextDocument);
    }

    const startPos = merlin.Position.fromCode(change.range.start);
    const endPos = merlin.Position.fromCode(change.range.end);
    const request = merlin.Sync.tell(startPos, endPos, change.text);
    await this.session.merlin.sync(request, newDocument);
  }

  private async onDidChangeTextDocument(event: LSP.DidChangeTextDocumentParams): Promise<void> {
    for (const change of event.contentChanges) {
      if (null == change) continue;
      const oldDocument = this.documents.get(event.textDocument.uri);
      if (null == oldDocument) continue;
      if (null == change.range) {
        await this.doFullSync(event.textDocument, oldDocument.languageId, change.text);
      } else {
        await this.doIncrementalSync(oldDocument, event.textDocument, change);
      }
      await this.session.analyzer.refreshDebounced(event.textDocument);
    }
  }

  private async onDidOpenTextDocument(event: LSP.DidOpenTextDocumentParams): Promise<void> {
    await this.doFullSync(event.textDocument, event.textDocument.languageId, event.textDocument.text);
    await this.session.analyzer.refreshImmediate(event.textDocument);
    await this.session.indexer.refreshSymbols(event.textDocument);
  }

  private onDidCloseTextDocument(event: LSP.DidCloseTextDocumentParams): void {
    this.documents.delete(event.textDocument.uri);
    this.session.analyzer.clear(event.textDocument);
  }

  private async onDidSaveTextDocument(event: LSP.DidSaveTextDocumentParams): Promise<void> {
    await this.session.analyzer.refreshImmediate(event.textDocument);
  }
}
