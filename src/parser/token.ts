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
