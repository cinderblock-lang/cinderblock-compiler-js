import { WriterExpression } from "./expression";
import { WriterType } from "./type";

export abstract class WriterStatement {
  abstract get C(): string;
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

  get C(): string {
    return `${this.#type.Declare(this.#name)} = ${this.#assignment.C};`;
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

  get C(): string {
    return `${this.#subject}->${this.#name} = ${this.#assignment.C};`;
  }
}

export class WriterSideEffect extends WriterStatement {
  readonly #assignment: WriterExpression;

  constructor(assignment: WriterExpression) {
    super();
    this.#assignment = assignment;
  }

  get C(): string {
    return `${this.#assignment.C};`;
  }
}

export class WriterReturnStatement extends WriterStatement {
  readonly #assignment: WriterExpression;

  constructor(assignment: WriterExpression) {
    super();
    this.#assignment = assignment;
  }

  get C(): string {
    return `return ${this.#assignment.C};`;
  }
}

export class WriterEmptyStatement extends WriterStatement {
  constructor() {
    super();
  }

  get C(): string {
    return "";
  }
}

export class WriterRawStatement extends WriterStatement {
  readonly #statement: string;

  constructor(statement: string) {
    super();
    this.#statement = statement;
  }

  get C(): string {
    return this.#statement;
  }
}
