import { Expression } from "./base";
import { Component } from "../component";
import { ComponentGroup } from "../component-group";
import { CodeLocation } from "../../location/code-location";
import { ParserError } from "../../parser/error";

export class InvokationExpression extends Expression {
  readonly #subject: Component;
  readonly #parameters: ComponentGroup;

  constructor(
    ctx: CodeLocation,
    subject: Expression,
    parameters: ComponentGroup
  ) {
    super(ctx);
    this.#subject = subject;
    this.#parameters = parameters;
  }
}

Expression.Register({
  Priority: 2,
  Is(token_group, prefix) {
    return token_group.Text === "(" && !!prefix;
  },
  Extract(token_group, prefix) {
    if (!prefix)
      throw new ParserError(
        token_group.CodeLocation,
        "Attempting an invokation without a referenced function"
      );

    const [after_parameters, parameters] =
      token_group.Next.Text === ")"
        ? ([token_group.Next.Next, new ComponentGroup()] as const)
        : ComponentGroup.ParseWhile(
            token_group.Next,
            (g) => Expression.Parse(g, [",", ")"]),
            [")"],
            (g) => g.Previous.Text
          );

    return [
      after_parameters,
      new InvokationExpression(token_group.CodeLocation, prefix, parameters),
    ];
  },
});
