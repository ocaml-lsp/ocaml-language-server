import * as processes from "../processes";
import Session from "../session";

export default async function(session: Session): Promise<string[]> {
  const env = new processes.Env(session).process;
  if (null == env.stdin) {
    throw new Error("null == env.stdin");
  }
  env.stdin.end();
  const otxt = await new Promise<string>((resolve, reject) => {
    let buffer = "";
    if (null == env.stdout) {
      return reject("null == env.stdout");
    }
    env.stdout.on("error", (error: Error) => reject(error));
    env.stdout.on("data", (data: Buffer | string) => (buffer += data.toString()));
    env.stdout.on("end", () => resolve(buffer));
  });
  env.unref();
  return /^\s*$/.test(otxt) ? [] : otxt.trim().split("\n");
}
