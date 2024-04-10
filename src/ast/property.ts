import { CodeLocation } from "../location/code-location";
import { Component } from "./component";
import { Type } from "./type/base";

export class Property extends Component {
  readonly #name: string;
  readonly #type: Type;
  readonly #optional: boolean;

  constructor(ctx: CodeLocation, name: string, type: Type, optional: boolean) {
    super(ctx);
    this.#name = name;
    this.#type = type;
    this.#optional = optional;
  }

  get Name() {
    return this.#name;
  }

  get Type() {
    return this.#type;
  }

  get Optional() {
    return this.#optional;
  }
}
