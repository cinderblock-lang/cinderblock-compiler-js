import { Location } from "#compiler/location";
import { AstItem, Component, ComponentStore } from "./base";
import { Type } from "./type";

@AstItem
export class Property extends Component {
  readonly #name: string;
  readonly #type: number;
  readonly #optional: boolean;

  constructor(ctx: Location, name: string, type: Type, optional: boolean) {
    super(ctx);
    this.#name = name;
    this.#type = type.Index;
    this.#optional = optional;
  }

  get Name() {
    return this.#name;
  }

  get Type() {
    return ComponentStore.Get(this.#type);
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

@AstItem
export class FunctionParameter extends Component {
  readonly #name: string;
  readonly #type?: number;
  readonly #optional: boolean;

  constructor(
    ctx: Location,
    name: string,
    type: Type | undefined,
    optional: boolean
  ) {
    super(ctx);
    this.#name = name;
    this.#type = type?.Index;
    this.#optional = optional;
  }

  get Name() {
    return this.#name;
  }

  get Type() {
    return this.#type != null ? ComponentStore.Get(this.#type) : undefined;
  }

  get Optional() {
    return this.#optional;
  }

  get type_name() {
    return "function_parameter";
  }

  get extra_json() {
    return {
      name: this.#name,
      type_name: this.#type ?? null,
    };
  }
}
