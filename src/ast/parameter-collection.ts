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

  static Parse(token_group: TokenGroup) {
    return token_group.Build(
      {
        items: (token_group) =>
          token_group.Until((token_group) => {
            if (token_group.Text === ",") token_group = token_group.Next;
            return Parameter.Parse(token_group);
          }, ")"),
      },
      ({ items }) => new ParameterCollection(...items)
    );
  }
}
