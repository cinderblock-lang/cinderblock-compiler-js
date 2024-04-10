import { CodeLocation } from "../location/code-location";
import { Component } from "./component";
import { Type } from "./type/base";

export class FunctionParameter extends Component {
  readonly #name: string;
  readonly #type?: Type;
  readonly #optional: boolean;

  constructor(
    ctx: CodeLocation,
    name: string,
    type: Type | undefined,
    optional: boolean
  ) {
    super(ctx);
    this.#name = name;
    this.#type = type;
    this.#optional = optional;
  }
}
