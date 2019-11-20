import { CancellationToken, TextDocumentPositionParams } from "vscode-languageserver-protocol";
import { merlin } from "../../../lib";
import Session from "../session";

export default async (
  session: Session,
  token: CancellationToken,
  event: TextDocumentPositionParams,
  priority = 0,
): Promise<null | string> => {
  const position = merlin.Position.fromCode(event.position);
  const request = merlin.Query.document(null).at(position);
  const response = await session.merlin.query(request, token, event.textDocument, priority);
  if ("return" !== response.class) return null;
  return response.value;
};
