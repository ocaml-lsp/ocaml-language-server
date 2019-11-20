import * as LSP from "vscode-languageserver-protocol";
import { URI } from "vscode-uri";
import { merlin } from "../../../lib";
import Session from "../session";
import * as support from "../support";

export default function(session: Session): LSP.RequestHandler<LSP.TextDocumentPositionParams, LSP.Definition, never> {
  return support.cancellableHandler(session, async (event, token) => {
    const find = async (kind: "ml" | "mli"): Promise<null | LSP.Location> => {
      const colLine = merlin.Position.fromCode(event.position);
      const request = merlin.Query.locate(null, kind).at(colLine);
      const response = await session.merlin.query(request, token, event.textDocument);
      if ("return" !== response.class) return null;
      if (null == response.value.pos) return null;
      const uri = response.value.file ? URI.file(response.value.file).toString() : event.textDocument.uri;
      const position = merlin.Position.intoCode(response.value.pos);
      const range = LSP.Range.create(position, position);
      const location = LSP.Location.create(uri, range);
      return location;
    };
    const locML = await find("ml");
    const locations: LSP.Location[] = [];
    if (null != locML) locations.push(locML);
    return locations;
  });
}
