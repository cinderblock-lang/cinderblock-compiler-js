import { IClosure } from "../../linker/closure";
import { CodeLocation } from "../../location/code-location";
import { Component } from "../component";
import { Closure } from "../expression/closure";
import { ParameterCollection } from "../parameter-collection";
import { Type } from "../type/base";
import { Entity, EntityOptions } from "./base";

export class FunctionEntity extends Entity implements IClosure {
  readonly #name: string;
  readonly #parameters: ParameterCollection;
  readonly #content: Closure;
  readonly #returns: Type | undefined;

  constructor(
    ctx: CodeLocation,
    options: EntityOptions,
    name: string,
    parameters: ParameterCollection,
    content: Closure,
    returns: Type | undefined
  ) {
    super(ctx, options);
    this.#name = name;
    this.#parameters = parameters;
    this.#content = content;
    this.#returns = returns;
  }

  Resolve(name: string): Component | undefined {
    return this.#content.Resolve(name) ?? this.#parameters.Resolve(name);
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

    let parameters: ParameterCollection;
    [token_group, parameters] = ParameterCollection.Parse(token_group);

    let returns: undefined | Type = undefined;
    if (token_group.Text === ":") {
      [token_group, returns] = Type.Parse(token_group.Next);
    }

    let body: Closure;
    [token_group, body] = Closure.Parse(token_group);

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
