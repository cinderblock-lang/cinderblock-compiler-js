import { CodeLocation } from "../location/code-location";

export abstract class Component {
  readonly #location: CodeLocation;

  constructor(location: CodeLocation) {
    this.#location = location;
  }

  get CodeLocation() {
    return this.#location;
  }
}
