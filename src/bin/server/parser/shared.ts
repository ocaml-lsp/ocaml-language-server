import * as LSP from "vscode-languageserver-protocol";

type DiagnosticSource = "bucklescript" | "refmt";

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const createDiagnostic = (source: DiagnosticSource) => (
  message: string,
  startCharacter: number,
  startLine: number,
  endCharacter: number,
  endLine: number,
  severity: LSP.DiagnosticSeverity,
) => {
  return {
    code: "",
    message,
    range: {
      end: {
        character: endCharacter,
        line: endLine,
      },
      start: {
        character: startCharacter,
        line: startLine,
      },
    },
    severity,
    source,
  };
};
