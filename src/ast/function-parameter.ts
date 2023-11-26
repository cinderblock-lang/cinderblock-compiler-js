import { LinkerError } from "../linker/error";
import { CodeLocation } from "../location/code-location";
import { Component } from "./component";
import { Type } from "./type/base";
import { WriterContext } from "./writer";

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

  get Name() {
    return this.#name;
  }

  get Type() {
    return this.#type != null ? this.#type : undefined;
  }

  get Optional() {
    return this.#optional;
  }

  get type_name() {
    return "function_parameter";
  }

  c(ctx: WriterContext): string {
    if (!this.Type) throw new LinkerError(this.CodeLocation, "Unresolved type");
    return `${this.Type.c(ctx)} ${this.Name}`;
  }

  resolve_type(ctx: WriterContext): Component {
    const type = this.Type;
    if (!type) throw new LinkerError(this.CodeLocation, "Unresolved type");

    return type.resolve_type(ctx);
  }
}
