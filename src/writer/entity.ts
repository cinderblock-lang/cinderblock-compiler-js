import { WriterStatement } from "./statement";

export abstract class WriterEntity {}

export class WriterFunction extends WriterEntity {
  readonly #name: string;
  readonly #parameters: Array<[string, string]>;
  readonly #returns: string;
  readonly #statements: Array<WriterStatement>;

  constructor(
    name: string,
    parameters: Array<[string, string]>,
    returns: string,
    statements: Array<WriterStatement>
  ) {
    super();
    this.#name = name;
    this.#parameters = parameters;
    this.#returns = returns;
    this.#statements = statements;
  }
}
