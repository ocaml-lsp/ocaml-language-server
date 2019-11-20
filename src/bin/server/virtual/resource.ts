import { URI } from "vscode-uri";
import { Host } from "./host";

export class Resource {
  public static from(source: Host, uri: URI): Resource {
    return new this(source, uri);
  }
  protected constructor(readonly source: Host, readonly uri: URI) {}
  public into(target: Host, skipEncoding: boolean = true): URI {
    switch (target) {
      case Host.Native:
        return this.readNative(skipEncoding);
      case Host.WSL:
        return this.readWSL(skipEncoding);
    }
  }
  protected readNative(skipEncoding: boolean): URI {
    const uriWSL = (): URI => {
      const uri = this.uri.toString(skipEncoding);
      // FIXME: move this check somewhere earlier and do it only once
      const localappdataFile = process.env.localappdata;
      if (null == localappdataFile) throw new Error("LOCALAPPDATA must be set in environment to interpret WSL /home");
      // FIXME: compute localappdata earlier and do it only once
      const localappdata = URI.file(localappdataFile).toString(skipEncoding);
      let match: RegExpMatchArray | null = null;
      // rewrite /mnt/…
      if (null != (match = uri.match(/^file:\/\/\/mnt\/([a-zA-Z])\/(.*)$/))) {
        match.shift();
        const drive = match.shift() as string;
        const rest = match.shift() as string;
        return URI.parse(`file:///${drive}:/${rest}`);
      }
      // rewrite /home/…
      if (null != (match = uri.match(/^file:\/\/\/home\/(.+)$/))) {
        match.shift();
        const rest = match.shift() as string;
        return URI.parse(`${localappdata}/lxss/home/${rest}`);
      }
      throw new Error("unreachable");
    };
    switch (this.source) {
      case Host.Native:
        return this.uri;
      case Host.WSL:
        return uriWSL();
    }
  }
  protected readWSL(skipEncoding: boolean): URI {
    const uriNative = (): URI => {
      const uri = this.uri.toString(skipEncoding);
      let match: RegExpMatchArray | null = null;
      if (null != (match = uri.match(/^file:\/\/\/([a-zA-Z]):(.*)$/))) {
        match.shift();
        const drive = match.shift() as string;
        const rest = match.shift() as string;
        return URI.parse(`file:///mnt/${drive}${rest}`);
      }
      throw new Error("unreachable");
    };
    switch (this.source) {
      case Host.Native:
        return uriNative();
      case Host.WSL:
        return this.uri;
    }
  }
}
