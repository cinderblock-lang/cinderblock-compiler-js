import { WriterProperty } from "./entity";

export abstract class WriterType {
  abstract Declare(name: string): string;

  abstract get TypeName(): string;
}

export class WriterFunctionType extends WriterType {
  readonly #parameters: Array<WriterProperty>;
  readonly #returns: WriterType;

  constructor(parameters: Array<WriterProperty>, returns: WriterType) {
    super();
    this.#parameters = parameters;
    this.#returns = returns;
  }

  Declare(name: string): string {
    const params = this.#parameters.map((p) => p.C).join(", ");
    return `${this.#returns.TypeName} (^${name})(${params})`;
  }

  get TypeName(): string {
    return this.Declare("__name");
  }
}

export class WriterStructType extends WriterType {
  readonly #name: string;

  constructor(name: string) {
    super();
    this.#name = name;
  }

  Declare(name: string): string {
    return `${this.TypeName} ${name}`;
  }

  get TypeName(): string {
    return this.#name + "*";
  }
}

export class WriterPrimitiveType extends WriterType {
  readonly #name: string;

  constructor(name: string) {
    super();
    this.#name = name;
  }

  Declare(name: string): string {
    return `${this.TypeName} ${name}`;
  }

  get TypeName(): string {
    return this.#name;
  }
}
