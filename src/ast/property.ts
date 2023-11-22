import { Location } from "#compiler/location";
import { Component } from "./base";
import { Type } from "./type";

export class Property extends Component {
  readonly #name: string;
  readonly #type: Component;
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
}

export class FunctionParameter extends Component {
  readonly #name: string;
  readonly #type?: Component;
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
}
