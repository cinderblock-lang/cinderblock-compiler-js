import { Expression } from "./base";
import { CodeLocation } from "../../location/code-location";
import { Context } from "../context";
import { LinkerError } from "../../linker/error";

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
  Is(token_group, prefix) {
    return true;
  },
  Extract(token_group, prefix, look_for) {
    return [
      token_group.Next,
      new ReferenceExpression(token_group.CodeLocation, token_group.Text),
    ];
  },
});
