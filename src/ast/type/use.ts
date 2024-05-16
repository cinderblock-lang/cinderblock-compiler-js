import { LinkerError } from "../../linker/error";
import { CodeLocation } from "../../location/code-location";
import { TokenGroupResponse } from "../../parser/token-group-response";
import { Context } from "../context";
import { ContextResponse } from "../context-response";
import { Type } from "./base";

export class UseType extends Type {
  readonly #name: string;
  readonly #constraints: Array<Type>;

  constructor(ctx: CodeLocation, name: string, constraints: Array<Type>) {
    super(ctx);
    this.#name = name;
    this.#constraints = constraints;
  }

  get Name() {
    return this.#name;
  }

  Linked(context: Context) {
    const invoked_with = context.GetCurrentParameter();
    if (!invoked_with)
      throw new LinkerError(
        this.CodeLocation,
        "error",
        "Could not resolve schema"
      );

    return new ContextResponse(
      context.WithType(this.#name, invoked_with.Type),
      invoked_with.Type
    );
  }
}

Type.Register({
  Priority: 1,
  Is(token_group) {
    return token_group.Text === "use";
  },
  Extract(token_group) {
    return token_group.Build(
      {
        constraints: (token_group) =>
          token_group.Until((token_group) => Type.Parse(token_group.Next), "="),
        name: (token_group) => TokenGroupResponse.TextItem(token_group),
      },
      ({ constraints, name }) =>
        new UseType(token_group.CodeLocation, name, constraints)
    );
  },
});
