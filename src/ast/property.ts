import { CodeLocation } from "../location/code-location";
import { Component } from "./component";
import { Type } from "./type/base";
import { WriterContext } from "./writer";

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

  get type_name() {
    return "property";
  }

  get extra_json() {
    return {
      name: this.#name,
      type_name: this.#type,
    };
  }

  c(ctx: WriterContext): string {
    return `${this.Type.c(ctx)} ${this.Name};`;
  }

  resolve_type(ctx: WriterContext): Component {
    return this.Type.resolve_type(ctx);
  }
}
