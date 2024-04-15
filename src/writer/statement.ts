import { WriterExpression } from "./expression";
import { WriterType } from "./type";

export abstract class WriterStatement {}

export class WriterVariableStatement {
  readonly #name: string;
  readonly #type: WriterType;
  readonly #assignment: WriterExpression;

  constructor(name: string, type: WriterType, assignment: WriterExpression) {
    this.#name = name;
    this.#type = type;
    this.#assignment = assignment;
  }
}

export class WriterAssignStatement {
  readonly #subject: string;
  readonly #name: string;
  readonly #assignment: WriterExpression;

  constructor(subject: string, name: string, assignment: WriterExpression) {
    this.#subject = subject;
    this.#name = name;
    this.#assignment = assignment;
  }
}

export class WriterSideEffect {
  readonly #assignment: WriterExpression;

  constructor(assignment: WriterExpression) {
    this.#assignment = assignment;
  }
}

export class WriterReturnStatement {
  readonly #assignment: WriterExpression;

  constructor(assignment: WriterExpression) {
    this.#assignment = assignment;
  }
}
