import { LinkedParameterCollection } from "../linked-ast/parameter-collection";
import { TokenGroup } from "../parser/token-group";
import { Context } from "./context";
import { ContextResponse } from "./context-response";
import { Parameter } from "./parameter";

export class ParameterCollection {
  readonly #components: Array<Parameter>;

  constructor(...components: Array<Parameter>) {
    this.#components = components;
  }

  Linked(context: Context): ContextResponse<LinkedParameterCollection> {
    return context.Build(
      {
        params: (context) =>
          context.Map(this.#components, (ctx, n, i) =>
            n.Linked(ctx.WithParameterIndex(i))
          ),
      },
      ({ params }) => new LinkedParameterCollection(...params)
    );
  }

  static Parse(token_group: TokenGroup): [TokenGroup, ParameterCollection] {
    const result: Array<Parameter> = [];
    if (token_group.Text === ")")
      return [token_group.Next, new ParameterCollection()];

    while (token_group.Previous.Text !== ")") {
      const [t, r] = Parameter.Parse(token_group);
      token_group = t;
      result.push(r);
    }

    return [token_group, new ParameterCollection(...result)];
  }
}
