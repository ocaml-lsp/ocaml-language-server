import * as Path from "path";
import * as LSP from "vscode-languageserver-protocol";
import { URI } from "vscode-uri";
import * as command from "../command";
import Session from "../session";

export default function(session: Session): LSP.NotificationHandler<LSP.DidChangeWatchedFilesParams> {
  return async (event: LSP.DidChangeWatchedFilesParams): Promise<void | LSP.ResponseError<void>> => {
    for (const id of event.changes) {
      const root = session.environment.workspaceRoot();
      const rawPath = URI.parse(id.uri).path;
      const path = Path.parse(root ? Path.relative(root, rawPath) : rawPath);
      switch (path.dir.split(Path.sep)[0]) {
        case "_build":
          return command.restartMerlin(session);
      }
      if (".ml" === path.ext) {
        return session.indexer.refreshSymbols(id);
      }
      if (".re" === path.ext) {
        return session.indexer.refreshSymbols(id);
      }
      if (".merlin" === path.base) {
        return command.restartMerlin(session);
      }
      if ("command-exec" === path.name) {
        return command.restartMerlin(session);
      }
    }
  };
}
