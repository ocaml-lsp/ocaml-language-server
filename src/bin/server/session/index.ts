import * as server from "vscode-languageserver";
import * as LSP from "vscode-languageserver-protocol";
import { ISettings } from "../../../lib";
import { Merlin } from "../processes";

import Analyzer from "./analyzer";
import Environment from "./environment";
import Indexer from "./indexer";
import Synchronizer from "./synchronizer";

export { Environment };

export type CancellationSources = "analyzer/refreshWithKind";

export default class Session implements LSP.Disposable {
  public readonly analyzer: Analyzer;
  public readonly cancellationSources: { readonly [S in CancellationSources]: LSP.CancellationTokenSource } = {
    "analyzer/refreshWithKind": new LSP.CancellationTokenSource(),
  };
  public readonly connection: server.IConnection = server.createConnection();
  public readonly environment: Environment;
  public readonly indexer: Indexer;
  public readonly initConf: LSP.InitializeParams;
  public readonly merlin: Merlin;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public readonly settings: ISettings = {} as any;
  public readonly synchronizer: Synchronizer;

  constructor() {
    this.analyzer = new Analyzer(this);
    this.environment = new Environment(this);
    this.indexer = new Indexer(this);
    this.merlin = new Merlin(this);
    this.synchronizer = new Synchronizer(this);
  }

  public cancelTokens<S extends CancellationSources>(sourceName: S): void {
    this.cancellationSources[sourceName].cancel();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this.cancellationSources[sourceName] as any) = new LSP.CancellationTokenSource();
    return;
  }

  public dispose(): void {
    this.analyzer.dispose();
    this.environment.dispose();
    this.indexer.dispose();
    this.merlin.dispose();
    this.synchronizer.dispose();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public error(data: any): void {
    this.connection.console.error(JSON.stringify(data, null, 2));
  }

  public async initialize(): Promise<void> {
    await this.environment.initialize();
    await this.merlin.initialize();
    await this.indexer.initialize();
    await this.synchronizer.initialize();
    await this.analyzer.initialize();
  }

  public listen(): void {
    this.synchronizer.listen();
    this.connection.listen();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public log(data: any): void {
    this.connection.console.log(JSON.stringify(data, null, 2));
  }

  public async onDidChangeConfiguration({ settings }: LSP.DidChangeConfigurationParams): Promise<void> {
    const oldMerlinPath = this.settings.reason.path.ocamlmerlin;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this.settings as any) = { ...this.settings, ...settings };
    if (this.settings.reason.path.ocamlmerlin !== oldMerlinPath) {
      // this.connection.console.log(`merlin path changed: ${settings.reason.path.ocamlmerlin}, restarting...`)
      await this.merlin.restart();
    }
    this.analyzer.onDidChangeConfiguration();
    this.synchronizer.onDidChangeConfiguration();
  }
}
