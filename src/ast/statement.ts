import { Location } from "#compiler/location";
import { AstItem, Component, ComponentStore } from "./base";
import { Expression } from "./expression";
import { Type } from "./type";

export abstract class Statement extends Component {}

@AstItem
export class StoreStatement extends Statement {
  readonly #name: string;
  readonly #equals: number;
  readonly #type?: number;

  constructor(ctx: Location, name: string, equals: Expression, type?: Type) {
    super(ctx);
    this.#name = name;
    this.#equals = equals.Index;
    this.#type = type?.Index;
  }

  get Name() {
    return this.#name;
  }

  get Equals() {
    return ComponentStore.Get(this.#equals);
  }

  get Type() {
    return this.#type ? ComponentStore.Get(this.#type) : undefined;
  }

  get type_name() {
    return "store_statement";
  }

  get extra_json() {
    return {
      name: this.#name,
      equals: this.#equals,
      store_type: this.#type,
    };
  }
}

@AstItem
export class ReturnStatement extends Statement {
  readonly #value: number;

  constructor(ctx: Location, value: Expression) {
    super(ctx);
    this.#value = value.Index;
  }

  get Value() {
    return ComponentStore.Get(this.#value);
  }

  get type_name() {
    return "return_statement";
  }

  get extra_json() {
    return {
      value: this.#value,
    };
  }
}

@AstItem
export class AssignStatement extends Statement {
  readonly #name: string;
  readonly #equals: number;

  constructor(ctx: Location, name: string, equals: Expression) {
    super(ctx);
    this.#name = name;
    this.#equals = equals.Index;
  }

  get Name() {
    return this.#name;
  }

  get Equals() {
    return ComponentStore.Get(this.#equals);
  }

  get type_name() {
    return "assign_statement";
  }

  get extra_json() {
    return {
      name: this.#name,
      equals: this.#equals,
    };
  }
}

@AstItem
export class PanicStatement extends Statement {
  readonly #value: number;

  constructor(ctx: Location, value: Expression) {
    super(ctx);
    this.#value = value.Index;
  }

  get Value() {
    return ComponentStore.Get(this.#value);
  }

  get type_name() {
    return "panic_statement";
  }

  get extra_json() {
    return {
      value: this.#value,
    };
  }
}
