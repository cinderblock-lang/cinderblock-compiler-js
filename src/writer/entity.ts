import { WriterStatement } from "./statement";
import type { WriterType } from "./type";

export abstract class WriterEntity {}

export class WriterString extends WriterEntity {
  readonly #name: string;
  readonly #value: string;

  constructor(name: string, value: string) {
    super();
    this.#name = name;
    this.#value = value;
  }
}

export class WriterFunction extends WriterEntity {
  readonly #name: string;
  readonly #parameters: Array<WriterProperty>;
  readonly #returns: WriterType;
  readonly #statements: Array<WriterStatement>;
  readonly #parent: WriterFunction | undefined;

  constructor(
    name: string,
    parameters: Array<WriterProperty>,
    returns: WriterType,
    statements: Array<WriterStatement>,
    parent: WriterFunction | undefined = undefined
  ) {
    super();
    this.#name = name;
    this.#parameters = parameters;
    this.#returns = returns;
    this.#statements = statements;
    this.#parent = parent;
  }

  WithStatement(statement: WriterStatement) {
    return new WriterFunction(
      this.#name,
      this.#parameters,
      this.#returns,
      [...this.#statements, statement],
      this.#parent
    );
  }

  WithStatements(statements: Array<WriterStatement>) {
    return new WriterFunction(
      this.#name,
      this.#parameters,
      this.#returns,
      [...this.#statements, ...statements],
      this.#parent
    );
  }
}

export class WriterStruct extends WriterEntity {
  readonly #name: string;
  readonly #properties: Array<WriterProperty>;

  constructor(name: string, properties: Array<WriterProperty>) {
    super();
    this.#name = name;
    this.#properties = properties;
  }
}

export class WriterProperty {
  readonly #name: string;
  readonly #type: WriterType;

  constructor(name: string, type: WriterType) {
    this.#name = name;
    this.#type = type;
  }
}
