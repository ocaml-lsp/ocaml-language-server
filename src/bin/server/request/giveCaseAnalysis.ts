import * as LSP from "vscode-languageserver-protocol";
import { merlin, types } from "../../../lib";
import Session from "../session";

export default function(
  session: Session,
): LSP.RequestHandler<types.ITextDocumentRange, null | merlin.Case.Destruct, void> {
  return async (event, token): Promise<null | merlin.Case.Destruct> => {
    const start = merlin.Position.fromCode(event.range.start);
    const end = merlin.Position.fromCode(event.range.end);
    const request = merlin.Query.kase.analysis.from(start).to(end);
    const response = await session.merlin.query(request, token, event.textDocument);
    if (token.isCancellationRequested) {
      return null;
    }
    if ("return" !== response.class) {
      throw response.value;
    }
    return response.value;
  };
}
