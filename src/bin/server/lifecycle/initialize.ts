import * as LSP from "vscode-languageserver-protocol";
import { ISettings } from "../../../lib";
import capabilities from "../capabilities";
import Session from "../session";

export default function(
  session: Session,
): LSP.RequestHandler<LSP.InitializeParams, LSP.InitializeResult, LSP.InitializeError> {
  return async (event): Promise<LSP.InitializeResult> => {
    const overrides: typeof ISettings.defaults.reason | undefined | null = event.initializationOptions;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (session.initConf as any) = event;
    session.settings.reason = ISettings.withDefaults(overrides);
    await session.initialize();
    return { capabilities };
  };
}
