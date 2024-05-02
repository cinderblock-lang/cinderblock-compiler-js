import { CodeLocation } from "../location/code-location";

export abstract class LinkedComponent {
  readonly #location: CodeLocation;

  constructor(location: CodeLocation) {
    this.#location = location;
  }

  get CodeLocation() {
    return this.#location;
  }

  get CName() {
    return this.#location.CName;
  }
}
