import { ParserError } from "./error";
import { Token } from "./token";

export class TokenGroup {
  readonly #tokens: Array<Token>;
  readonly #index: number;

  constructor(tokens: Array<Token>, index = 0) {
    this.#tokens = tokens;
    this.#index = index;
  }

  get #value() {
    return this.#tokens[this.#index];
  }

  get CodeLocation() {
    return this.#value.CodeLocation;
  }

  get Text() {
    return this.#value.Text;
  }

  get Done() {
    return this.#index >= this.#tokens.length;
  }

  get Next() {
    return new TokenGroup(this.#tokens, this.#index + 1);
  }

  get Previous() {
    return new TokenGroup(this.#tokens, this.#index - 1);
  }

  Expect(...symbols: Array<string>) {
    if (!symbols.includes(this.Text))
      throw ParserError.UnexpectedSymbol(this, ...symbols);
  }

  Skip(count: number) {
    return new TokenGroup(this.#tokens, this.#index + count);
  }
}
