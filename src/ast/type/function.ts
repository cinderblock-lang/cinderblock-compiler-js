import { CodeLocation } from "../../location/code-location";
import { Component } from "../component";
import { ComponentGroup } from "../component-group";
import { StructEntity } from "../entity/struct";
import { FunctionParameter } from "../function-parameter";
import { Type } from "./base";

export class FunctionType extends Type {
  readonly #parameters: ComponentGroup;
  readonly #returns: Component;

  constructor(
    ctx: CodeLocation,
    parameters: ComponentGroup,
    returns: Type | StructEntity
  ) {
    super(ctx);
    this.#parameters = parameters;
    this.#returns = returns;
  }
}

Type.Register({
  Priority: 1,
  Is(token_group) {
    return token_group.Text === "(";
  },
  Extract(token_group) {
    token_group.Expect("(");
    const [after_parameters, parameters] = ComponentGroup.ParseWhile(
      token_group.Next,
      FunctionParameter.Parse,
      [")"]
    );

    after_parameters.Expect("->");

    const [after_returns, returns] = Type.Parse(after_parameters.Next);

    return [
      after_returns,
      new FunctionType(token_group.CodeLocation, parameters, returns),
    ];
  },
});
