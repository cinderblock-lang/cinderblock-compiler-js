import { Component } from "../ast/component";
import { __ALLOCATE, __SCOPE } from "./constants";
import type { WriterFunction } from "./entity";
import { WriterVariableStatement } from "./statement";
import { WriterType } from "./type";

export abstract class WriterExpression {
  abstract get C(): string;
}

export class WriterAccessExpression extends WriterExpression {
  readonly #target: WriterExpression;
  readonly #name: string;

  constructor(target: WriterExpression, name: string) {
    super();
    this.#target = target;
    this.#name = name;
  }

  get C(): string {
    return `${this.#target.C}->${this.#name}`;
  }
}

export class WriterTernayExpression extends WriterExpression {
  readonly #check: WriterExpression;
  readonly #on_if: WriterExpression;
  readonly #on_else: WriterExpression;

  constructor(
    check: WriterExpression,
    on_if: WriterExpression,
    on_else: WriterExpression
  ) {
    super();
    this.#check = check;
    this.#on_if = on_if;
    this.#on_else = on_else;
  }

  get C(): string {
    return `${this.#check.C} ? ${this.#on_if.C} : ${this.#on_else.C}`;
  }
}

export class WriterOperatorExpression extends WriterExpression {
  readonly #left: WriterExpression;
  readonly #right: WriterExpression;
  readonly #operator: string;

  constructor(
    left: WriterExpression,
    right: WriterExpression,
    operator: string
  ) {
    super();
    this.#left = left;
    this.#right = right;
    this.#operator = operator;
  }

  get C(): string {
    return `${this.#left.C} ${this.#operator} ${this.#right.C}`;
  }
}

export class WriterInvokationExpression extends WriterExpression {
  readonly #subject: WriterExpression;
  readonly #parameters: Array<WriterExpression>;

  constructor(subject: WriterExpression, parameters: Array<WriterExpression>) {
    super();
    this.#subject = subject;
    this.#parameters = parameters;
  }

  get C(): string {
    const params = this.#parameters.map((p) => p.C).join(",");
    if (this.#subject instanceof WriterFunctionReferenceExpression) {
      return `${this.#subject.C}(${params})`;
    }

    return `(*${this.#subject.C})(${params})`;
  }
}

export class WriterReferenceExpression extends WriterExpression {
  readonly #item: Component;

  constructor(item: Component) {
    super();
    this.#item = item;
  }

  get C(): string {
    return this.#item.CName;
  }
}

export class WriterAllocateExpression extends WriterExpression {
  readonly #item: WriterType;

  constructor(item: WriterType) {
    super();
    this.#item = item;
  }

  get C(): string {
    return `${__ALLOCATE}(${__SCOPE}, sizeof(${this.#item.TypeName}))`;
  }
}

export class WriterLiteralExpression extends WriterExpression {
  readonly #value: string;

  constructor(value: string) {
    super();
    this.#value = value;
  }

  get C(): string {
    return this.#value;
  }
}

export class WriterFunctionReferenceExpression extends WriterExpression {
  readonly #entity: WriterFunction;

  constructor(entity: WriterFunction) {
    super();
    this.#entity = entity;
  }

  get C() {
    return this.#entity.Reference;
  }
}
