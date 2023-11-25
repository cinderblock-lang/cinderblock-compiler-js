import { Location } from "#compiler/location";
import { ResolveExpressionType } from "../linker/resolve";
import { Component, WriterContext } from "./base";
import { Expression } from "./expression";

export abstract class Statement extends Component {}

export class RawStatement extends Statement {
  readonly #c_code: string;
  readonly #reference: string;
  readonly #creates: Component;

  constructor(
    location: Location,
    c_code: string,
    reference: string,
    creates: Component
  ) {
    super(location);
    this.#c_code = c_code;
    this.#reference = reference;
    this.#creates = creates;
  }

  get Reference() {
    return this.#reference;
  }

  get Creates() {
    return this.#creates;
  }

  get type_name(): string {
    return "raw_statement";
  }

  c(ctx: WriterContext): string {
    ctx.prefix.push(this.#c_code);
    return this.#reference;
  }
}

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

  c(ctx: WriterContext): string {
    let prefix: Array<string> = [];
    let suffix: Array<string> = [];

    const type = ResolveExpressionType(this.Equals, ctx);

    ctx.locals[this.Name] = this;

    const expression = this.Equals.c(ctx);

    ctx.prefix.push(
      `${type.c(ctx)}* ${this.Name} = malloc(sizeof(${type.c(ctx)}));`
    );

    ctx.suffix.push(`free(${this.Name});`);

    ctx.prefix.push(`*${this.Name} = ${expression};`);

    return "*" + this.Name;
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

  c(ctx: WriterContext): string {
    const type = ResolveExpressionType(this.Value, ctx);
    const expression = this.Value.c(ctx);
    ctx.prefix.push(`${type.c(ctx)} result = ${expression};`);

    return `result`;
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

  c(ctx: WriterContext): string {
    const expression = this.Equals.c(ctx);
    const type = ResolveExpressionType(this.Equals, ctx);

    ctx.prefix.push(`${type.c(ctx)} ${this.Name} = ${expression};`);

    return this.Name;
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

  c(ctx: WriterContext): string {
    const expression = this.Value.c(ctx);

    ctx.prefix.push(`exit(${expression});`);

    return ``;
  }
}
