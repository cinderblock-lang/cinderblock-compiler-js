import { CodeLocation } from "../../location/code-location";
import { Component } from "../component";
import { ComponentGroup } from "../component-group";
import { FunctionParameter } from "../function-parameter";
import { Type } from "../type/base";
import { Entity, EntityOptions } from "./base";

export class FunctionEntity extends Entity {
  readonly #name: string;
  readonly #parameters: ComponentGroup;
  readonly #content: ComponentGroup;
  readonly #returns: Component | undefined;

  constructor(
    ctx: CodeLocation,
    options: EntityOptions,
    name: string,
    parameters: ComponentGroup,
    content: ComponentGroup,
    returns: Component | undefined
  ) {
    super(ctx, options);
    this.#name = name;
    this.#parameters = parameters;
    this.#content = content;
    this.#returns = returns;
  }
}

Entity.Register({
  Is(token_group) {
    return token_group.Text === "fn";
  },
  Extract(token_group, options) {
    const name = token_group.Next.Text;
    token_group = token_group.Skip(2);

    token_group.Expect("(");
    token_group = token_group.Next;

    let parameters: ComponentGroup;
    [token_group, parameters] = ComponentGroup.ParseWhile(
      token_group,
      FunctionParameter.Parse,
      [")"]
    );

    let returns: undefined | Type = undefined;
    if (token_group.Text === ":") {
      [token_group, returns] = Type.Parse(token_group.Next);
    }

    let body: ComponentGroup;
    [token_group, body] = ComponentGroup.ParseOptionalExpression(token_group);

    return [
      token_group,
      new FunctionEntity(
        token_group.CodeLocation,
        options,
        name,
        parameters,
        body,
        returns
      ),
    ];
  },
});
