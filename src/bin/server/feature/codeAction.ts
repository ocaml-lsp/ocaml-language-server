import * as LSP from "vscode-languageserver-protocol";
import Session from "../session";
import * as support from "../support";

export default function(session: Session): LSP.RequestHandler<LSP.CodeActionParams, LSP.Command[], never> {
  return support.cancellableHandler(session, async event => {
    const actions: LSP.Command[] = [];
    let matches: null | RegExpMatchArray = null;
    for (const { message, range } of event.context.diagnostics) {
      if (message === "Functions must be defined with => instead of the = symbol.") {
        const title = "change = to =>";
        const command = "reason.codeAction.fixEqualsShouldBeArrow";
        const location = LSP.Location.create(event.textDocument.uri, range);
        const args = [location];
        const action = LSP.Command.create(title, command, args);
        actions.push(action);
        continue;
      }
      if (message === "Statements must be terminated with a semicolon.") {
        const title = "insert missing semicolon";
        const command = "reason.codeAction.fixMissingSemicolon";
        const location = LSP.Location.create(event.textDocument.uri, range);
        const args = [location];
        const action = LSP.Command.create(title, command, args);
        actions.push(action);
        continue;
      }
      if (null != (matches = message.match(/Warning (?:26|27): unused variable\s+\b(\w+)\b/))) {
        const title = "ignore unused variable";
        const command = "reason.codeAction.fixUnusedVariable";
        const location = LSP.Location.create(event.textDocument.uri, range);
        const args = [location, matches[1]];
        const action = LSP.Command.create(title, command, args);
        actions.push(action);
        continue;
      }
    }
    return actions;
  });
}
