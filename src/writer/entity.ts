import { WriterStatement, WriterVariableStatement } from "./statement";
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
      .encode(eval(this.#value))
      .reduce((c, n) => [...c, n.toString()], [] as Array<string>)
      .concat(["0"])
      .join(",");
    return `char ${this.#name}[] = {${chars}};`;
  }
}

export class WriterFunction extends WriterEntity {
  static #functions: Record<string, WriterFunction> = {};

  readonly #name: string;
  readonly #parameters: Array<WriterProperty>;
  readonly #returns: WriterType;
  readonly #statements: Array<WriterStatement>;
  readonly #parent_name: string | undefined;

  static #declared: Array<string> = [];

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
    this.#parent_name = parent?.Name;

    WriterFunction.#functions[name] = this;
  }

  get Name() {
    return this.#name;
  }

  get HasParent() {
    return !!this.#parent;
  }

  get #parent(): WriterFunction | undefined {
    if (!this.#parent_name) return undefined;
    return WriterFunction.#functions[this.#parent_name];
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

  IsParameter(name: string) {
    return !!this.#parameters.find((p) => p.Name === name);
  }

  get Statements() {
    return this.#statements;
  }

  get Reference(): string {
    return this.#name;
  }

  get Declaration(): string {
    if (this.HasParent) return "";
    if (WriterFunction.#declared.includes(this.#name)) return "";
    WriterFunction.#declared = [...WriterFunction.#declared, this.#name];

    let params = this.#parameters.map((p) => p.C).join(", ");

    const top_line = this.#returns.Declare(`${this.#name}(${params})`);

    const statements = this.#statements.map((s) => s.C(this)).join("\n  ");
    return `${top_line} {\n  ${statements}\n}`;
  }

  BlockDeclaration(depth: number): string {
    const line_start = " ".repeat((depth - 1) * 2);
    let params = this.#parameters.map((p) => p.C).join(", ");

    return [
      `Block_copy(^ ${this.#returns.TypeName} (${params}) {`,
      ...this.#statements.map((s) => "  " + s.C(this)),
      "})",
    ].join("\n" + line_start);
  }

  get #deep_parameters(): Array<WriterProperty> {
    let result: Array<WriterProperty> = [];

    if (this.#parent) {
      result = [
        ...result,
        ...this.#parent.#variables.map(
          (v) => new WriterProperty(v.Name, v.Type)
        ),
      ];
      result = [...result, ...this.#parent.#deep_parameters];
    }

    return result;
  }

  get #variables(): Array<WriterVariableStatement> {
    let result: Array<WriterVariableStatement> = [];
    for (const statement of this.#statements)
      if (statement instanceof WriterVariableStatement)
        result = [...result, statement];

    return result;
  }

  get CurriedParameters() {
    return this.#deep_parameters.map((d) => d.Name).join(", ");
  }

  get Type() {
    return new WriterFunctionType(this.#parameters, this.#returns);
  }
}

export class WriterStruct extends WriterEntity {
  readonly #name: string;
  readonly #properties: Array<WriterProperty>;

  static #declared: Array<string> = [];

  constructor(name: string, properties: Array<WriterProperty>) {
    super();
    this.#name = name;
    this.#properties = properties;
  }

  get Reference(): string {
    return this.#name;
  }

  get Declaration(): string {
    if (WriterStruct.#declared.includes(this.#name)) return "";
    WriterStruct.#declared = [...WriterStruct.#declared, this.#name];

    const properties = this.#properties.map((s) => s.C + ";").join("\n  ");
    return `typedef struct ${this.#name} {\n  ${properties}\n} ${this.#name};`;
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

  get Name() {
    return this.#name;
  }
}
