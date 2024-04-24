import { Expression } from "./base";
import { CodeLocation } from "../../location/code-location";

export class ReferenceExpression extends Expression {
  readonly #name: string;

  constructor(ctx: CodeLocation, name: string) {
    super(ctx);
    this.#name = name;
  }

  get Name() {
    return this.#name;
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
