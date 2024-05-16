import { CodeLocation } from "../../location/code-location";
import { Type } from "./base";
import { ParserError } from "../../parser/error";
import { IsPrimitiveName, PrimitiveName } from "../../parser/types";
import { Context } from "../context";
import { ContextResponse } from "../context-response";
import { LinkedPrimitiveType } from "../../linked-ast/type/primitive";
import { LinkerError } from "../../linker/error";
import { TokenGroupResponse } from "../../parser/token-group-response";

export class PrimitiveType extends Type {
  readonly #name: PrimitiveName;

  constructor(ctx: CodeLocation, name: PrimitiveName) {
    super(ctx);
    this.#name = name;
  }

  get Name() {
    return this.#name;
  }

  Linked(context: Context) {
    const invoked_with = context.GetCurrentParameter();
    if (invoked_with) {
      const invoked_type = invoked_with.Type;
      if (!(invoked_type instanceof LinkedPrimitiveType))
        throw new LinkerError(
          this.CodeLocation,
          "error",
          "Attempting to invoke with the incorrect type"
        );

      if (invoked_type.Name !== this.#name)
        throw new LinkerError(
          this.CodeLocation,
          "error",
          "Attempting to invoke with the incorrect type"
        );
    }

    return new ContextResponse(
      context,
      new LinkedPrimitiveType(this.CodeLocation, this.#name)
    );
  }
}

Type.Register({
  Priority: 1,
  Is(token_group) {
    return IsPrimitiveName(token_group.Text);
  },
  Extract(token_group) {
    return token_group.Build(
      {
        name: (token_group) => {
          const name = token_group.Text;

          if (!IsPrimitiveName(name))
            throw new ParserError(
              token_group.CodeLocation,
              "Invalid primitive name"
            );

          return new TokenGroupResponse(token_group.Next, name);
        },
      },
      ({ name }) => new PrimitiveType(token_group.CodeLocation, name)
    );
  },
});
