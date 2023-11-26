import { CodeLocation } from "../../location/code-location";
import { Component } from "../component";

export abstract class Entity extends Component {
  readonly #exported: boolean;

  constructor(ctx: CodeLocation, exported: boolean) {
    super(ctx);
    this.#exported = exported;
  }

  get Exported() {
    return this.#exported;
  }
}
