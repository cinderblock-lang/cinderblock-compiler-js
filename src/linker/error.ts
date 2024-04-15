import { CodeLocation } from "../location/code-location";

export type Severity = "error" | "warn";

export class LinkerError extends Error {
  readonly #location: CodeLocation;
  readonly #severity: Severity;
  readonly #message: string;

  constructor(
    location: CodeLocation | undefined,
    severity: Severity,
    message: string
  ) {
    super(`Linker error`);
    this.#location = location ?? new CodeLocation("", -1, -1, -1, -1);
    this.#severity = severity;
    this.#message = message;
  }

  get Location() {
    return this.#location;
  }

  get Severity() {
    return this.#severity;
  }

  get Message() {
    return this.#message;
  }
}
