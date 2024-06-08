import { Expression } from "./base";
import { CodeLocation } from "../../location/code-location";
import { Context } from "../context";
import { LinkerError } from "../../linker/error";
import { TokenGroupResponse } from "../../parser/token-group-response";

export class ReferenceExpression extends Expression {
  readonly #name: string;

  constructor(ctx: CodeLocation, name: string) {
    super(ctx);
    this.#name = name;
  }

  get Name() {
    return this.#name;
  }

  Linked(context: Context) {
    const target = context.GetObject(this.#name);

    if (!target)
      throw new LinkerError(
        this.CodeLocation,
        "error",
        "Could not resolve symbol"
      );

    return target;
  }
}

Expression.Register({
  Priority: 0,
  Is() {
    return true;
  },
  Extract(token_group) {
    return token_group.Build(
      {
        name: (token_group) => TokenGroupResponse.TextItem(token_group),
      },
      ({ name }) => new ReferenceExpression(token_group.CodeLocation, name)
    );
  },
});
