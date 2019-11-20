import * as LSP from "vscode-languageserver-protocol";
import * as parser from "../parser";
import Session from "../session";
import * as support from "../support";

export default function(session: Session): LSP.RequestHandler<LSP.CompletionItem, LSP.CompletionItem, never> {
  return support.cancellableHandler(session, async event => {
    // FIXME: might want to make a separate parser to just strip ocamldoc
    const documentation: string = event.data.documentation
      .replace(/\{\{:.*?\}(.*?)\}/g, "$1")
      .replace(/\{!(.*?)\}/g, "$1");
    const markedDoc = parser.ocamldoc
      .intoMarkdown(documentation)
      .replace(/`(.*?)`/g, "$1")
      .replace(/\s+/g, " ")
      .replace(/\n/g, "");
    event.documentation = markedDoc;
    return event;
  });
}
