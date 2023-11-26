import { CodeLocation } from "../location/code-location";

export class LinkerError extends Error {
  readonly #location: CodeLocation;
  readonly #message: string;

  constructor(location: CodeLocation | undefined, message: string) {
    super(`${message}${location}`);

    this.#location = location ?? new CodeLocation("", -1, -1, -1, -1);
    this.#message = message;
  }
}
