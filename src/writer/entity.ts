import { WriterStatement } from "./statement";
import { WriterFunctionType, type WriterType } from "./type";

export abstract class WriterEntity {
  abstract get Reference(): string;

  abstract get Declaration(): string;
}

export class WriterString extends WriterEntity {
  readonly #name: string;
  readonly #value: string;

  constructor(name: string, value: string) {
    super();
    this.#name = name;
    this.#value = value;
  }

  get Reference(): string {
    return `&${this.#name}`;
  }

  get Declaration(): string {
    const chars = new TextEncoder()
      .encode(eval(`"${this.#value}"`))
      .reduce((c, n) => [...c, n.toString()], [] as Array<string>)
      .concat(["0"])
      .join(",");
    return `char ${this.#name}[] = {${chars}};`;
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

  get Reference(): string {
    return this.#name;
  }

  get Declaration(): string {
    const params = this.#parameters.map((p) => p.C).join(",");
    let top_line = `${this.#returns.TypeName} ${this.#name}(${params})`;
    if (this.#returns instanceof WriterFunctionType) {
      top_line = `${this.#returns.ReturnDeclare(this.#name)}(${params})`;
    }

    const statements = this.#statements.map((s) => s.C).join("\n  ");
    return `${top_line} {\n  ${statements}\n}`;
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

  get Reference(): string {
    return this.#name;
  }

  get Declaration(): string {
    const properties = this.#properties.map((s) => s.C).join("\n  ");
    return `#typedef ${this.#name} {\n  ${properties}\n} ${this.#name};`;
  }
}

export class WriterProperty {
  readonly #name: string;
  readonly #type: WriterType;

  constructor(name: string, type: WriterType) {
    this.#name = name;
    this.#type = type;
  }

  get C(): string {
    return this.#type.Declare(this.#name);
  }
}
