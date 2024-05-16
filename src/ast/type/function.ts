import { LinkedFunctionType } from "../../linked-ast/type/function";
import { CodeLocation } from "../../location/code-location";
import { Context } from "../context";
import { ParameterCollection } from "../parameter-collection";
import { Type } from "./base";

export class FunctionType extends Type {
  readonly #parameters: ParameterCollection;
  readonly #returns: Type;

  constructor(
    ctx: CodeLocation,
    parameters: ParameterCollection,
    returns: Type
  ) {
    super(ctx);
    this.#parameters = parameters;
    this.#returns = returns;
  }

  get Name() {
    return "func";
  }

  get Parameters() {
    return this.#parameters;
  }

  get Returns() {
    return this.#returns;
  }

  Linked(context: Context) {
    return context.Build(
      {
        parameters: (c) => this.#parameters.Linked(c),
        returns: (c) => this.Returns.Linked(c),
      },
      ({ parameters, returns }) =>
        new LinkedFunctionType(this.CodeLocation, parameters, returns)
    );
  }
}

Type.Register({
  Priority: 1,
  Is(token_group) {
    return token_group.Text === "(";
  },
  Extract(token_group) {
    return token_group.Build(
      {
        parameters: (token_group) => {
          token_group = token_group.Next;
          return ParameterCollection.Parse(token_group);
        },
        returns: (token_group) => {
          token_group.Expect("->");
          token_group = token_group.Next;
          return Type.Parse(token_group);
        },
      },
      ({ parameters, returns }) =>
        new FunctionType(token_group.CodeLocation, parameters, returns)
    );
  },
});
