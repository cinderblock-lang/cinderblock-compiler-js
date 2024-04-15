import { Component } from "../ast/component";
import { WriterFunction } from "./entity";
import { WriterType } from "./type";

export abstract class WriterExpression {}

export class WriterAccessExpression extends WriterExpression {
  readonly #target: WriterExpression;
  readonly #name: string;

  constructor(target: WriterExpression, name: string) {
    super();
    this.#target = target;
    this.#name = name;
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
}

export class WriterInvokationExpression extends WriterExpression {
  readonly #subject: WriterExpression;
  readonly #parameters: Array<WriterExpression>;

  constructor(subject: WriterExpression, parameters: Array<WriterExpression>) {
    super();
    this.#subject = subject;
    this.#parameters = parameters;
  }
}

export class WriterReferenceExpression extends WriterExpression {
  readonly #item: Component;

  constructor(item: Component) {
    super();
    this.#item = item;
  }
}

export class WriterAllocateExpression extends WriterExpression {
  readonly #item: WriterType;

  constructor(item: WriterType) {
    super();
    this.#item = item;
  }
}

export class WriterLiteralExpression extends WriterExpression {
  readonly #value: string;

  constructor(value: string) {
    super();
    this.#value = value;
  }
}

export class WriterFunctionReferenceExpression extends WriterExpression {
  readonly #entity: WriterFunction;

  constructor(entity: WriterFunction) {
    super();
    this.#entity = entity;
  }
}
