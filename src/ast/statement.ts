import { Location } from "#compiler/location";
import { AstItem, Component, ComponentGroup, ComponentStore } from "./base";
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

  copy() {
    return new StoreStatement(
      this.Location,
      this.Name,
      this.Equals.copy(),
      this.Type
    );
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

  copy() {
    return new ReturnStatement(this.Location, this.Value.copy());
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

  copy() {
    return new AssignStatement(this.Location, this.Name, this.Equals.copy());
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

  copy() {
    return new PanicStatement(this.Location, this.Value.copy());
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

@AstItem
export class AsmStatement extends Statement {
  readonly #text: string;
  readonly #read?: string;
  readonly #read_as?: string;
  readonly #registers: Array<string>;

  readonly #inputs: ComponentGroup;

  constructor(
    ctx: Location,
    text: string,
    read: string | undefined,
    read_as: string | undefined,
    registers: Array<string>,
    inputs: ComponentGroup
  ) {
    super(ctx);
    this.#text = text;
    this.#read = read;
    this.#read_as = read_as;
    this.#registers = registers;
    this.#inputs = inputs;
  }

  copy() {
    return new AsmStatement(
      this.Location,
      this.Text,
      this.Read,
      this.ReadAs,
      this.Registers,
      this.Inputs
    );
  }

  get Text() {
    return this.#text;
  }

  get Read() {
    return this.#read;
  }

  get ReadAs() {
    return this.#read_as;
  }

  get Registers() {
    return this.#registers;
  }

  get Inputs() {
    return this.#inputs;
  }

  get type_name() {
    return "asm_statement";
  }

  get extra_json() {
    return {
      text: this.#text,
      read: this.#read,
      inputs: this.#inputs,
    };
  }
}
