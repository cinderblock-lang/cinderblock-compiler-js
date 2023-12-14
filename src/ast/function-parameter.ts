import { LinkerError } from "../linker/error";
import { CodeLocation } from "../location/code-location";
import { Namer } from "../location/namer";
import { Component } from "./component";
import { Type } from "./type/base";
import { WriterContext } from "./writer";

export class FunctionParameter extends Component {
  readonly #name: string;
  readonly #type?: Type;
  readonly #optional: boolean;
  readonly #cname: string;

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
    this.#cname = name === "ctx" ? name : Namer.GetName();
  }

  get Name() {
    return this.#name;
  }

  get CName() {
    return this.#cname;
  }

  get Type() {
    return this.#type != null ? this.#type : undefined;
  }

  get Optional() {
    return this.#optional;
  }

  get type_name() {
    return `p_${this.Type?.type_name}`;
  }

  c(ctx: WriterContext): string {
    if (!this.Type) throw new LinkerError(this.CodeLocation, "Unresolved type");
    return `${this.Type.c(ctx)} ${this.#cname}`;
  }

  resolve_type(ctx: WriterContext): Component {
    const type = this.Type;
    if (!type) throw new LinkerError(this.CodeLocation, "Unresolved type");

    return type.resolve_type(ctx);
  }
}
