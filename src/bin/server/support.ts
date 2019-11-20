import * as LSP from "vscode-languageserver-protocol";
import * as RPC from "vscode-jsonrpc";
import Session from "./session";

export type AsyncRequestHandler<P, R, E> = (
  event: P,
  token: LSP.CancellationToken,
) => Thenable<R | LSP.ResponseError<E>>;

export function cancellableHandler<P, R, E>(
  _session: Session,
  handler: AsyncRequestHandler<P, R, E>,
): LSP.RequestHandler<P, R, E> {
  return (event, token): RPC.HandlerResult<R, E> => {
    const sentinel = new Promise((_resolve, reject) =>
      token.onCancellationRequested(() => {
        const error = new LSP.ResponseError(LSP.ErrorCodes.RequestCancelled, "cancellableHandler::reject");
        return reject(error);
      }),
    );
    return Promise.race([sentinel, handler(event, token)]) as Thenable<R> | Thenable<LSP.ResponseError<E>>;
  };
}
