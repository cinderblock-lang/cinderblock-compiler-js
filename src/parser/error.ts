import { CodeLocation } from "../location/code-location";
import { Token, TokenGroup } from "./token";

export class ParserError extends Error {
  readonly #location: CodeLocation;
  readonly #message: string;

  constructor(location: CodeLocation | undefined, message: string) {
    super(`${message}${location}`);

    this.#location = location ?? new CodeLocation("", -1, -1, -1, -1);
    this.#message = message;
  }

  static get EndOfFile() {
    return new ParserError(undefined, "Unexpected end of file");
  }

  static UnexpectedSymbol(
    received: TokenGroup | Token,
    ...expected: Array<string>
  ) {
    return new ParserError(
      received.CodeLocation,
      `Unexpected symbol. Expected one of ${expected
        .map((e) => `'${e}'`)
        .join(", ")} but received '${received.Text}'`
    );
  }
}
