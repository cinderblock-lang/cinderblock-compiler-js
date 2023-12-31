import { CodeLocation } from "../location/code-location";

export class Token {
  readonly #location: CodeLocation;
  readonly #text: string;

  constructor(location: CodeLocation, text: string) {
    this.#location = location;
    this.#text = text;
  }

  get CodeLocation() {
    return this.#location;
  }

  get Text() {
    return this.#text;
  }

  get json() {
    return {
      location: this.#location.json,
      text: this.#text,
    };
  }
}

export class TokenGroup {
  readonly #tokens: Iterator<Token>;
  #current: IteratorResult<Token>;

  constructor(tokens: Iterator<Token>) {
    this.#tokens = tokens;
    this.#current = this.#tokens.next();
  }

  next() {
    const result = this.#current;
    this.#current = this.#tokens.next();
    return result;
  }

  peek(): Token | undefined {
    if (this.#current.done) return undefined;
    return this.#current.value;
  }
}
