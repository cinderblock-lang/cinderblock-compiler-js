import { __SCOPE } from "./constants";
import { WriterFunction } from "./entity";
import { WriterExpression } from "./expression";
import { WriterType } from "./type";

export abstract class WriterStatement {
  abstract C(func: WriterFunction): string;
}

export class WriterVariableStatement extends WriterStatement {
  readonly #name: string;
  readonly #type: WriterType;
  readonly #assignment: WriterExpression;

  constructor(name: string, type: WriterType, assignment: WriterExpression) {
    super();
    this.#name = name;
    this.#type = type;
    this.#assignment = assignment;
  }

  get Name() {
    return this.#name;
  }

  get Type() {
    return this.#type;
  }

  C(func: WriterFunction): string {
    return `${__SCOPE}.${this.#name} = ${this.#assignment.C(func)};`;
  }
}

export class WriterAssignStatement extends WriterStatement {
  readonly #subject: string;
  readonly #name: string;
  readonly #assignment: WriterExpression;

  constructor(subject: string, name: string, assignment: WriterExpression) {
    super();
    this.#subject = subject;
    this.#name = name;
    this.#assignment = assignment;
  }

  C(func: WriterFunction): string {
    const access = `${this.#subject}->${this.#name}`;
    return `${__SCOPE}.${access} = ${this.#assignment.C(func)};`;
  }
}

export class WriterSideEffect extends WriterStatement {
  readonly #assignment: WriterExpression;

  constructor(assignment: WriterExpression) {
    super();
    this.#assignment = assignment;
  }

  C(func: WriterFunction): string {
    return `${this.#assignment.C(func)};`;
  }
}

export class WriterReturnStatement extends WriterStatement {
  readonly #assignment: WriterExpression;

  constructor(assignment: WriterExpression) {
    super();
    this.#assignment = assignment;
  }

  C(func: WriterFunction): string {
    return `return ${this.#assignment.C(func)};`;
  }
}

export class WriterEmptyStatement extends WriterStatement {
  constructor() {
    super();
  }

  C(): string {
    return "";
  }
}

export class WriterRawStatement extends WriterStatement {
  readonly #statement: string;

  constructor(statement: string) {
    super();
    this.#statement = statement;
  }

  C(): string {
    return this.#statement;
  }
}
