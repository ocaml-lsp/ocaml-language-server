import * as LSP from "vscode-languageserver-protocol";

export default function(): LSP.NotificationHandler0 {
  return (): void => {
    // session.dispose();
  };
}
