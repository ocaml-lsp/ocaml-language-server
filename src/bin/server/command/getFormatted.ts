import * as LSP from "vscode-languageserver-protocol";
import { refmt as refmtParser } from "../parser";
import * as processes from "../processes";
import Session from "../session";

export async function ocpIndent(session: Session, doc: LSP.TextDocument): Promise<string> {
  const text = doc.getText();
  const ocpIndent = new processes.OcpIndent(session, []).process;
  if (null == ocpIndent.stdin) {
    throw new Error("null == ocpIndent.stdin");
  }
  ocpIndent.stdin.write(text);
  ocpIndent.stdin.end();
  const res = await new Promise<string>((resolve, reject) => {
    let buffer = "";
    if (null == ocpIndent.stdout) {
      return reject("null == ocpIndent.stdout");
    }
    ocpIndent.stdout.on("error", (error: Error) => reject(error));
    ocpIndent.stdout.on("data", (data: Buffer | string) => (buffer += data.toString()));
    ocpIndent.stdout.on("end", () => resolve(buffer));
  });
  ocpIndent.unref();
  return res;
}

export async function ocpIndentRange(session: Session, doc: LSP.TextDocument, range: LSP.Range): Promise<number[]> {
  const text = doc.getText();
  const args: string[] = ["--indent-empty", `--lines=${range.start.line}-${range.end.line}`, "--numeric"];
  const ocpIndent = new processes.OcpIndent(session, args).process;
  if (null == ocpIndent.stdin) {
    throw new Error("null == ocpIndent.stdin");
  }
  ocpIndent.stdin.write(text);
  ocpIndent.stdin.end();
  const output = await new Promise<string>((resolve, reject) => {
    let buffer = "";
    if (null == ocpIndent.stdout) {
      return reject("null == ocpIndent.stdout");
    }
    ocpIndent.stdout.on("error", (error: Error) => reject(error));
    ocpIndent.stdout.on("data", (data: Buffer | string) => (buffer += data.toString()));
    ocpIndent.stdout.on("end", () => resolve(buffer));
  });
  ocpIndent.unref();
  const indents: number[] = [];
  const pattern = /\d+/g;
  let match: null | RegExpExecArray = null;
  while (null != (match = pattern.exec(output))) {
    const digits = match.shift() as string;
    const indent = parseInt(digits, 10);
    indents.push(indent);
  }
  return indents;
}

// Temporary measure until there is some persisted list of diagnostics shared between services
let lastDiagnostics: LSP.Diagnostic[] = [];
export async function refmt(session: Session, doc: LSP.TextDocument, range?: LSP.Range): Promise<null | string> {
  if (null != range) {
    session.connection.console.warn("Selection formatting not support for Reason");
    return null;
  }
  const text = doc.getText();
  if (/^\s*$/.test(text)) return text;
  const refmt = new processes.ReFMT(session, doc).process;
  if (null == refmt.stdin) {
    throw new Error("null == refmt.stdin");
  }
  refmt.stdin.write(text);
  refmt.stdin.end();
  const otxt = await new Promise<string>((resolve, reject) => {
    let buffer = "";
    let bufferError = "";

    if (null == refmt.stdout) {
      return reject("null == refmt.stdout");
    }
    refmt.stdout.on("error", (error: Error) => reject(error));
    refmt.stdout.on("data", (data: Buffer | string) => (buffer += data.toString()));
    refmt.stdout.on("end", () => resolve(buffer));

    if (null == refmt.stderr) {
      return reject("null == refmt.stderr");
    }
    refmt.stderr.on("data", (data: Buffer | string) => (bufferError += data.toString()));
    refmt.stderr.on("end", () => {
      const diagnostics = refmtParser.parseErrors(bufferError);
      if (diagnostics.length !== 0 || diagnostics.length !== lastDiagnostics.length) {
        session.connection.sendDiagnostics({
          diagnostics,
          uri: doc.uri,
        });
      }
      lastDiagnostics = diagnostics;
    });
  });
  refmt.unref();
  return /^\s*$/.test(otxt) ? null : otxt.trim();
}
