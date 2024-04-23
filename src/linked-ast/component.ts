import { CodeLocation } from "../location/code-location";
import { Namer } from "../location/namer";

export abstract class LinkedComponent {
  readonly #location: CodeLocation;
  readonly #c_name: string;

  constructor(location: CodeLocation) {
    this.#location = location;
    this.#c_name = Namer.GetName();
  }

  get CodeLocation() {
    return this.#location;
  }

  get CName() {
    return this.#c_name;
  }
}
