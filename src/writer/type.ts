import { WriterProperty } from "./entity";

export abstract class WriterType {}

export class WriterFunctionType extends WriterType {
  readonly #parameters: Array<WriterProperty>;
  readonly #returns: WriterType;

  constructor(parameters: Array<WriterProperty>, returns: WriterType) {
    super();
    this.#parameters = parameters;
    this.#returns = returns;
  }
}

export class WriterStringType extends WriterType {
  readonly #name: string;

  constructor(name: string) {
    super();
    this.#name = name;
  }
}
