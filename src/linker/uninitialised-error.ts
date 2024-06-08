import { CodeLocation } from "../location/code-location";

export type Severity = "error" | "warn";

export class UninitialisedError extends Error {
  readonly #location: CodeLocation;
  readonly #message: string;

  constructor(location: CodeLocation | undefined, message: string) {
    super(`Parser Error:\n${location}\n\n${message}`);
    this.#location = location ?? new CodeLocation("", -1, -1, -1, -1);
    this.#message = message;
  }

  get Location() {
    return this.#location;
  }

  get Message() {
    return this.#message;
  }
}
