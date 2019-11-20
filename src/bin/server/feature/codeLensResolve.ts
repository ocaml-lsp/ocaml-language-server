import * as LSP from "vscode-languageserver-protocol";
import * as command from "../command";
import Session from "../session";
import * as support from "../support";

export default function(session: Session): LSP.RequestHandler<LSP.CodeLens, LSP.CodeLens, never> {
  return support.cancellableHandler(session, async (event, token) => {
    const data: LSP.SymbolInformation & {
      event: LSP.TextDocumentPositionParams;
      fileKind: "ml" | "re";
    } = event.data;
    const itemType = await command.getType(session, data.event, token, 1);
    if (null == itemType) return event;

    event.command = { command: "", title: itemType.type };
    if ("re" === data.fileKind) event.command.title = event.command.title.replace(/ : /g, ": ");
    if (!session.settings.reason.codelens.unicode) return event;
    if ("ml" === data.fileKind) event.command.title = event.command.title.replace(/->/g, "→");
    if ("ml" === data.fileKind) event.command.title = event.command.title.replace(/\*/g, "×");
    if ("re" === data.fileKind) event.command.title = event.command.title.replace(/=>/g, "⇒");
    return event;
  });
}
