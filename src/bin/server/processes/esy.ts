import Session from "../session";

export default class Esy {
  constructor(private readonly session: Session) {}

  public async run(): Promise<string> {
    const command = this.session.settings.reason.path.esy;
    const args = ["build"];
    const esy = this.session.environment.spawn(command, args);
    const res = await new Promise<string>((resolve, reject) => {
      let buffer = "";
      esy.on("error", (error: Error & { code: string }) => {
        if ("ENOENT" === error.code) {
          const msg = `Perhapse we cannot find esy binary at "${command}".`;
          this.session.connection.window.showWarningMessage(msg);
          this.session.connection.window.showWarningMessage(
            `Double check your path or try configuring "reason.path.esy" under "User Settings". Do you need to "npm install -g esy"? Alternatively, disable "esy" in "reason.diagnostics.tools"`,
          );
        }
        return reject(error);
      });
      if (null == esy.stdout) {
        return reject("null == esy.stdout");
      }
      esy.stdout.on("data", (data: Buffer | string) => (buffer += data.toString()));
      esy.stdout.on("end", () => resolve(buffer));
    });
    return res;
  }
}
