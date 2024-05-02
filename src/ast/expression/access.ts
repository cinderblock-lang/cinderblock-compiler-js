import { LinkedAccessExpression } from "../../linked-ast/expression/access";
import { CodeLocation } from "../../location/code-location";
import { ParserError } from "../../parser/error";
import { Context } from "../context";
import { Expression } from "./base";

export class AccessExpression extends Expression {
  readonly #subject: Expression;
  readonly #target: string;

  constructor(ctx: CodeLocation, subject: Expression, target: string) {
    super(ctx);
    this.#subject = subject;
    this.#target = target;
  }

  get Subject() {
    return this.#subject;
  }

  Linked(context: Context) {
    return context.Build(
      {
        subject: (c) => this.#subject.Linked(c),
      },
      ({ subject }) =>
        new LinkedAccessExpression(this.CodeLocation, subject, this.#target)
    );
  }
}

Expression.Register({
  Priority: 2,
  Is(token_group) {
    return token_group.Text === ".";
  },
  Extract(token_group, prefix) {
    if (!prefix)
      throw new ParserError(
        token_group.CodeLocation,
        "Attempting an access without a left hand side"
      );

    const accessed = token_group.Next;

    return [
      accessed.Next,
      new AccessExpression(accessed.CodeLocation, prefix, accessed.Text),
    ];
  },
});
