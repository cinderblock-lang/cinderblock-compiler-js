import { WriterStatement } from "./statement";
import type { WriterType } from "./type";

export abstract class WriterEntity {}

export class WriterFunction extends WriterEntity {
  readonly #name: string;
  readonly #parameters: Array<WriterProperty>;
  readonly #returns: WriterType;
  readonly #statements: Array<WriterStatement>;

  constructor(
    name: string,
    parameters: Array<WriterProperty>,
    returns: WriterType,
    statements: Array<WriterStatement>
  ) {
    super();
    this.#name = name;
    this.#parameters = parameters;
    this.#returns = returns;
    this.#statements = statements;
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
