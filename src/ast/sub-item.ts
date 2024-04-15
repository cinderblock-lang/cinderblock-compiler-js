import { Scope } from "../linker/closure";
import { CodeLocation } from "../location/code-location";
import { WriterProperty } from "../writer/entity";
import { Component } from "./component";
import { Type } from "./type/base";

export class SubItem extends Component {
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

  Build(scope: Scope): WriterProperty {
    return new WriterProperty(this.CName, this.#type.Build(scope));
  }
}
