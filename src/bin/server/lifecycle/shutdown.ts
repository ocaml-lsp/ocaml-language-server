import * as LSP from "vscode-languageserver-protocol";
import Session from "../session";

export default function(session: Session): LSP.NotificationHandler0 {
  return (): void => {
    session.dispose();
  };
}
