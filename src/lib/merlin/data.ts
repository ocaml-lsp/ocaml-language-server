import * as LSP from "vscode-languageserver-protocol";
import * as ordinal from "./ordinal";

export namespace Case {
  export type Destruct = [{ end: ordinal.IColumnLine; start: ordinal.IColumnLine }, string];
}

export namespace Completion {
  export interface ILabel {
    name: string;
    type: string;
  }
  export type Context = null | ["application", { argument_type: string; labels: ILabel[] }];
  export type Kind =
    | "#"
    | "Class"
    | "Constructor"
    | "Exn"
    | "Label"
    | "Method"
    | "Module"
    | "Signature"
    | "Type"
    | "Value"
    | "Variant";
  export namespace Kind {
    export function intoCode(kind: Kind): LSP.CompletionItemKind {
      switch (kind) {
        case "#":
          return LSP.CompletionItemKind.Method;
        case "Class":
          return LSP.CompletionItemKind.Class;
        case "Constructor":
          return LSP.CompletionItemKind.Constructor;
        case "Exn":
          return LSP.CompletionItemKind.Constructor;
        case "Label":
          return LSP.CompletionItemKind.Field;
        case "Method":
          return LSP.CompletionItemKind.Function;
        case "Module":
          return LSP.CompletionItemKind.Module;
        case "Signature":
          return LSP.CompletionItemKind.Interface;
        case "Type":
          return LSP.CompletionItemKind.Class;
        case "Value":
          return LSP.CompletionItemKind.Value;
        case "Variant":
          return LSP.CompletionItemKind.Enum;
      }
    }
  }
  export interface IEntry {
    name: string;
    kind: Kind;
    desc: string;
    info: string;
  }
  export function intoCode({ name: label, kind, desc: detail, info: documentation }: IEntry): LSP.CompletionItem {
    return {
      data: {
        documentation,
      },
      detail,
      kind: Kind.intoCode(kind),
      label,
    };
  }
}

export interface IErrorReport {
  start: ordinal.IColumnLine;
  end: ordinal.IColumnLine;
  valid: boolean;
  message: string;
  type: IErrorReport.Type;
}
export namespace IErrorReport {
  export type Type = "env" | "error" | "parser" | "type" | "unknown" | "warning";
  export namespace Type {
    export function intoCode(type: Type): LSP.DiagnosticSeverity {
      switch (type) {
        case "env":
          return LSP.DiagnosticSeverity.Error;
        case "error":
          return LSP.DiagnosticSeverity.Error;
        case "parser":
          return LSP.DiagnosticSeverity.Error;
        case "type":
          return LSP.DiagnosticSeverity.Error;
        case "unknown":
          return LSP.DiagnosticSeverity.Error;
        case "warning":
          return LSP.DiagnosticSeverity.Warning;
      }
    }
  }
  async function improveMessage(session: any, { uri }: LSP.Location, original: string): Promise<string> {
    if (original === "Invalid statement") {
      const document = session.synchronizer.getText(uri);
      if (document && document.getText() === "=") {
        return "Functions must be defined with => instead of the = symbol.";
      }
    }
    if (original === "Statement has to end with a semicolon") {
      return "Statements must be terminated with a semicolon.";
    }
    return original;
  }
  function getCode(message: string): string {
    const codeMatch = /^Warning\s*(\d+)?:/.exec(message);
    return codeMatch && codeMatch.length > 1 ? codeMatch[1] : "";
  }
  export async function intoCode(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    session: any,
    { uri }: LSP.TextDocumentIdentifier,
    { end, message: original, start, type }: IErrorReport,
  ): Promise<LSP.Diagnostic> {
    const range = {
      end: ordinal.Position.intoCode(end),
      start: ordinal.Position.intoCode(start),
    };
    const location = { range, uri };
    const message = await improveMessage(session, location, original);
    const code = getCode(original);
    const severity = Type.intoCode(type);
    const source = "merlin";
    return LSP.Diagnostic.create(range, message, severity, code, source);
  }
}

export namespace Outline {
  export type Kind =
    | "Class"
    | "Constructor"
    | "Exn"
    | "Label"
    | "Method"
    | "Modtype"
    | "Module"
    | "Signature" // FIXME
    | "Type"
    | "Value";
  export namespace Kind {
    export function intoCode(kind: Kind): LSP.SymbolKind {
      switch (kind) {
        case "Class":
          return LSP.SymbolKind.Class;
        case "Constructor":
          return LSP.SymbolKind.Constructor;
        case "Exn":
          return LSP.SymbolKind.Constructor;
        case "Label":
          return LSP.SymbolKind.Field;
        case "Method":
          return LSP.SymbolKind.Method;
        case "Modtype":
          return LSP.SymbolKind.Interface;
        case "Module":
          return LSP.SymbolKind.Module;
        case "Signature":
          return LSP.SymbolKind.Interface;
        case "Type":
          return LSP.SymbolKind.Class;
        case "Value":
          return LSP.SymbolKind.Variable;
      }
    }
  }
  export interface IItem {
    start: ordinal.IColumnLine;
    end: ordinal.IColumnLine;
    name: string;
    kind: Kind;
    children: IItem[];
  }
  export function intoCode(outline: IItem[], id: LSP.TextDocumentIdentifier): LSP.SymbolInformation[] {
    const symbols: LSP.SymbolInformation[] = [];
    function traverse(children: IItem[], scope: string): void {
      for (const item of children) {
        if (item) {
          const kind = Kind.intoCode(item.kind);
          const range = {
            end: ordinal.Position.intoCode(item.end),
            start: ordinal.Position.intoCode(item.start),
          };
          const thisParent = scope === "" ? undefined : scope;
          const nextParent = `${scope}${scope === "" ? "" : "."}${item.name}`;
          const info = LSP.SymbolInformation.create(item.name, kind, range, id.uri, thisParent);
          symbols.push(info);
          traverse(item.children, nextParent);
        }
      }
    }
    traverse(outline, "");
    return symbols;
  }
}
export type Outline = Outline.IItem[];

export type TailPosition = "call" | "no" | "position";
export namespace TailPosition {
  export function intoCode(info: TailPosition): LSP.MarkedString {
    const language = "reason.hover.info";
    const position = (arg: string) => ({ language, value: `position: ${arg}` });
    switch (info) {
      case "call":
        return position("tail (call)");
      case "no":
        return position("normal");
      case "position":
        return position("tail");
    }
  }
}

export interface IType {
  start: ordinal.Position;
  end: ordinal.Position;
  type: string;
  tail: TailPosition;
}
