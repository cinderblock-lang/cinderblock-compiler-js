import { Location } from "#compiler/location";
import { LinkerError } from "../linker/error";
import { Component, WriterContext } from "./base";
import { Type } from "./type";

export class Property extends Component {
  readonly #name: string;
  readonly #type: Type;
  readonly #optional: boolean;

  constructor(ctx: Location, name: string, type: Type, optional: boolean) {
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
}

export class FunctionParameter extends Component {
  readonly #name: string;
  readonly #type?: Type;
  readonly #optional: boolean;

  constructor(
    ctx: Location,
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
    if (!this.Type) throw new LinkerError(this.Location, "Unresolved type");
    return `${this.Type.c(ctx)} ${this.Name}`;
  }
}
