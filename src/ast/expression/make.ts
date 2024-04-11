import { Expression } from "./base";
import { ComponentGroup } from "../component-group";
import { CodeLocation } from "../../location/code-location";
import { Type } from "../type/base";

export class MakeExpression extends Expression {
  readonly #struct: Type;
  readonly #using: ComponentGroup;

  constructor(ctx: CodeLocation, struct: Type, using: ComponentGroup) {
    super(ctx);
    this.#struct = struct;
    this.#using = using;
  }
}

Expression.Register({
  Priority: 3,
  Is(token_group, prefix) {
    return token_group.Text === "make";
  },
  Extract(token_group, prefix) {
    const [after_type, type] = Type.Parse(token_group.Next);

    const [after_using, using] =
      ComponentGroup.ParseOptionalExpression(after_type);

    return [
      after_using,
      new MakeExpression(token_group.CodeLocation, type, using),
    ];
  },
});
