import Session from "../session";

export default class BuckleScript {
  constructor(private readonly session: Session) {}

  public async run(): Promise<string> {
    const command = this.session.settings.reason.path.bsb;
    const args = ["-make-world"];
    const bsb = this.session.environment.spawn(command, args);
    const res = await new Promise<string>((resolve, reject) => {
      let buffer = "";
      bsb.on("error", (error: Error & { code: string }) => {
        if ("ENOENT" === error.code) {
          const msg = `Cannot find bsb binary at "${command}".`;
          this.session.connection.window.showWarningMessage(msg);
          this.session.connection.window.showWarningMessage(
            `Double check your path or try configuring "reason.path.bsb" under "User Settings". Alternatively, disable "bsb" in "reason.diagnostics.tools"`,
          );
        }
        return reject(error);
      });
      if (null == bsb.stdout) {
        return reject("null == bsb.stdout");
      }
      bsb.stdout.on("data", (data: Buffer | string) => (buffer += data.toString()));
      bsb.stdout.on("end", () => resolve(buffer));
      bsb.on("uncaughtException", (error: Error & { code: string }) => {
        // Useful for some specific cases, like bsb not having permissions to write to the file system
        this.session.connection.window.showWarningMessage(error.message);
        return reject(error);
      });
    });
    return res;
  }
}
