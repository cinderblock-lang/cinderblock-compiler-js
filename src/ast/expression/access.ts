import { CodeLocation } from "../../location/code-location";
import { ParserError } from "../../parser/error";
import { Component } from "../component";
import { Expression } from "./base";

export class AccessExpression extends Expression {
  readonly #subject: Component;
  readonly #target: string;

  constructor(ctx: CodeLocation, subject: Expression, target: string) {
    super(ctx);
    this.#subject = subject;
    this.#target = target;
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
