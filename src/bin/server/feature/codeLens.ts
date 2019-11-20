import * as LSP from "vscode-languageserver-protocol";
import { merlin } from "../../../lib";
import * as command from "../command";
import Session from "../session";
import * as support from "../support";

const annotateKinds = new Set<number>([LSP.SymbolKind.Variable]);

export default function(session: Session): LSP.RequestHandler<LSP.CodeLensParams, LSP.CodeLens[], never> {
  return support.cancellableHandler(session, async ({ textDocument }, token) => {
    if (!session.settings.reason.codelens.enabled) {
      return [];
    }

    const languages: Set<string> = new Set(session.settings.reason.server.languages);
    if (languages.size < 1) return [];

    const allowedFileKinds: string[] = [];
    if (languages.has("ocaml")) allowedFileKinds.push("ml");
    if (languages.has("reason")) allowedFileKinds.push("re");

    const fileKindMatch = textDocument.uri.match(new RegExp(`.(${allowedFileKinds.join("|")})$`));
    if (null == fileKindMatch) return [];
    const fileKind = fileKindMatch[1];

    const request = merlin.Query.outline();
    const response = await session.merlin.query(request, token, textDocument, 1);
    if ("return" !== response.class) return [];
    const outline = response.value;

    const document = await command.getTextDocument(session, textDocument);
    if (null == document) return [];

    const symbols = merlin.Outline.intoCode(outline, textDocument);
    const codeLenses: LSP.CodeLens[] = [];
    let matches: null | RegExpMatchArray = null;
    let textLine: null | string = null;
    for (const { containerName, kind, location, name } of symbols) {
      if (annotateKinds.has(kind)) {
        const { range } = location;
        const { start } = range;
        const end = LSP.Position.create(start.line + 1, 0);
        const { character, line } = start;
        const position = LSP.Position.create(line, character);
        const event = { position, textDocument };
        // reason requires computing some offsets first
        if (
          null != (textLine = document.getText().substring(document.offsetAt(start), document.offsetAt(end))) &&
          null !=
            (matches = textLine.match(
              /^\s*\b(and|let)\b(\s*)(\brec\b)?(\s*)(?:(?:\(?(?:[^)]*)\)?(?:\s*::\s*(?:(?:\b\w+\b)|\((?:\b\w+\b):.*?\)=(?:\b\w+\b)))?|\((?:\b\w+\b)(?::.*?)?\))\s*)(?:(?:(?:(?:\b\w+\b)(?:\s*::\s*(?:(?:\b\w+\b)|\((?:\b\w+\b):.*?\)=(?:\b\w+\b)))?|\((?:\b\w+\b)(?::.*?)?\))\s*)|(?::(?=[^:])(?:.*?=>)*)?(?:.*?=)\s*[^\s=;]+?\s*.*?;?$)/m,
            ))
        ) {
          event.position.character += matches[1].length;
          event.position.character += matches[2].length;
          event.position.character += matches[3] ? matches[3].length : 0;
          event.position.character += matches[4].length;
        }
        if (null != matches) {
          codeLenses.push({
            data: { containerName, event, fileKind, kind, location, name },
            range,
          });
        }
      }
    }

    return codeLenses;
  });
}
