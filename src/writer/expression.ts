import { Component } from "../ast/component";
import { WriterEntity, WriterFunction } from "./entity";
import { WriterType } from "./type";

export abstract class WriterExpression {
  abstract C(func: WriterFunction): string;
}

export class WriterAccessExpression extends WriterExpression {
  readonly #target: WriterExpression;
  readonly #name: string;

  constructor(target: WriterExpression, name: string) {
    super();
    this.#target = target;
    this.#name = name;
  }

  C(func: WriterFunction): string {
    return `${this.#target.C(func)}->${this.#name}`;
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

  C(func: WriterFunction): string {
    return `${this.#check.C(func)} ? ${this.#on_if.C(func)} : ${this.#on_else.C(
      func
    )}`;
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

  C(func: WriterFunction): string {
    return `${this.#left.C(func)} ${this.#operator} ${this.#right.C(func)}`;
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

  C(func: WriterFunction): string {
    const params = this.#parameters.map((p) => p.C(func)).join(", ");
    if (this.#subject instanceof WriterGlobalReferenceExpression) {
      return `${this.#subject.C()}(${params})`;
    }

    return `(*${this.#subject.C(func)})(${params})`;
  }
}

export class WriterReferenceExpression extends WriterExpression {
  readonly #item: string;

  constructor(item: Component) {
    super();
    this.#item = item.CName;
  }

  C(func: WriterFunction): string {
    if (func.IsParameter(this.#item)) return this.#item;
    return this.#item;
  }
}

export class WriterAllocateExpression extends WriterExpression {
  readonly #item: WriterType;

  constructor(item: WriterType) {
    super();
    this.#item = item;
  }

  C(): string {
    return `malloc(sizeof(${this.#item.TypeName}))`;
  }
}

export class WriterLiteralExpression extends WriterExpression {
  readonly #value: string;

  constructor(value: string) {
    super();
    this.#value = value;
  }

  C(): string {
    return this.#value;
  }
}

export class WriterGlobalReferenceExpression extends WriterExpression {
  readonly #entity: WriterEntity;

  constructor(entity: WriterEntity) {
    super();
    this.#entity = entity;
  }

  C() {
    return this.#entity.Reference;
  }
}
