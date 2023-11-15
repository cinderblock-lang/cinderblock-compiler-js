import { Location } from "#compiler/location";

export class LinkerError extends Error {
  readonly #location: Location;
  readonly #message: string;

  constructor(location: Location | undefined, message: string) {
    super(`${message}${location}`);

    this.#location = location ?? new Location("", -1, -1, -1, -1);
    this.#message = message;
  }
}
