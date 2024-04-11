import { Expression } from "./base";
import { ComponentGroup } from "../component-group";
import { CodeLocation } from "../../location/code-location";
import { Namer } from "../../location/namer";
import { Component } from "../component";
import { Type } from "../type/base";

export class LambdaExpression extends Expression {
  readonly #parameters: ComponentGroup;
  readonly #body: ComponentGroup;
  readonly #returns: Component | undefined;

  readonly #name: string;

  constructor(
    ctx: CodeLocation,
    parameters: ComponentGroup,
    body: ComponentGroup,
    returns: Component | undefined
  ) {
    super(ctx);
    this.#parameters = parameters;
    this.#body = body;
    this.#returns = returns;

    this.#name = Namer.GetName();
  }
}

Expression.Register({
  Priority: 3,
  Is(token_group, prefix) {
    return token_group.Text === "fn";
  },
  Extract(token_group, prefix) {
    token_group.Next.Expect("(");
    const [after_parameters, parameters] = ComponentGroup.ParseWhile(
      token_group.Next,
      Expression.Parse,
      [",", ")"]
    );

    const [after_returns, returns] =
      after_parameters.Text === ":"
        ? Type.Parse(after_parameters.Next)
        : ([after_parameters, undefined] as const);

    after_returns.Expect("->");

    const [after_body, body] = ComponentGroup.ParseOptionalExpression(
      after_returns.Next
    );

    return [
      after_body,
      new LambdaExpression(token_group.CodeLocation, parameters, body, returns),
    ];
  },
});
