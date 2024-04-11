import { Expression } from "./base";
import { CodeLocation } from "../../location/code-location";
import { Namer } from "../../location/namer";
import { Component } from "../component";
import { Type } from "../type/base";
import { Closure } from "./closure";
import { IClosure } from "../../linker/closure";
import { ParameterCollection } from "../parameter-collection";

export class LambdaExpression extends Expression implements IClosure {
  readonly #parameters: ParameterCollection;
  readonly #body: Closure;
  readonly #returns: Type | undefined;

  readonly #name: string;

  constructor(
    ctx: CodeLocation,
    parameters: ParameterCollection,
    body: Closure,
    returns: Type | undefined
  ) {
    super(ctx);
    this.#parameters = parameters;
    this.#body = body;
    this.#returns = returns;

    this.#name = Namer.GetName();
  }

  Resolve(name: string): Component | undefined {
    return this.#parameters.Resolve(name);
  }
}

Expression.Register({
  Priority: 3,
  Is(token_group, prefix) {
    return token_group.Text === "fn";
  },
  Extract(token_group, prefix) {
    token_group.Next.Expect("(");
    const [after_parameters, parameters] = ParameterCollection.Parse(
      token_group.Next
    );

    const [after_returns, returns] =
      after_parameters.Text === ":"
        ? Type.Parse(after_parameters.Next)
        : ([after_parameters, undefined] as const);

    after_returns.Expect("->");

    const [after_body, body] = Closure.Parse(after_returns.Next);

    return [
      after_body,
      new LambdaExpression(token_group.CodeLocation, parameters, body, returns),
    ];
  },
});
