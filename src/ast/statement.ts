import { Location } from "#compiler/location";
import { Component } from "./base";
import { Expression } from "./expression";
import { Type } from "./type";

export abstract class Statement extends Component {}

export class StoreStatement extends Statement {
  readonly #name: string;
  readonly #equals: Component;

  constructor(ctx: Location, name: string, equals: Expression) {
    super(ctx);
    this.#name = name;
    this.#equals = equals;
  }

  get Name() {
    return this.#name;
  }

  get Equals() {
    return this.#equals;
  }

  get type_name() {
    return "store_statement";
  }
}

export class ReturnStatement extends Statement {
  readonly #value: Component;

  constructor(ctx: Location, value: Expression) {
    super(ctx);
    this.#value = value;
  }

  get Value() {
    return this.#value;
  }

  get type_name() {
    return "return_statement";
  }
}

export class AssignStatement extends Statement {
  readonly #name: string;
  readonly #equals: Component;

  constructor(ctx: Location, name: string, equals: Expression) {
    super(ctx);
    this.#name = name;
    this.#equals = equals;
  }

  get Name() {
    return this.#name;
  }

  get Equals() {
    return this.#equals;
  }

  get type_name() {
    return "assign_statement";
  }
}

export class PanicStatement extends Statement {
  readonly #value: Component;

  constructor(ctx: Location, value: Expression) {
    super(ctx);
    this.#value = value;
  }

  get Value() {
    return this.#value;
  }

  get type_name() {
    return "panic_statement";
  }
}
