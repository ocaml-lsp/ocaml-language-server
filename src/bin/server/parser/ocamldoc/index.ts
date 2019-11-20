const parser: {
  parse(input: string): string;
} = require("./grammar"); // eslint-disable-line @typescript-eslint/no-var-requires

export const ignore = new RegExp(
  [
    /^Needed cmti file of module/,
    /^No documentation available/,
    /^Not a valid identifier/,
    /^Not in environment '.*'/,
    /^The initially opened module\.$/,
    /^didn't manage to find/,
  ]
    .map(rx => rx.source)
    .join("|"),
);

export function intoMarkdown(ocamldoc: string): string {
  let result = ocamldoc;
  try {
    result = parser.parse(ocamldoc);
  } catch (err) {
    //
  }
  return result;
}
