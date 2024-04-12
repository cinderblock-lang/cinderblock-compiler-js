import { IConcreteType } from "../../linker/closure";
import { CodeLocation } from "../../location/code-location";
import { Type } from "./base";

export class IterableType extends Type implements IConcreteType {
  readonly #type: Type;

  constructor(ctx: CodeLocation, type: Type) {
    super(ctx);
    this.#type = type;
  }

  get TypeName(): string {
    return "_ITERABLE";
  }
}

Type.Register({
  Priority: 1,
  Is(token_group) {
    return token_group.Text === "[";
  },
  Extract(token_group) {
    token_group.Expect("[");
    const [after_returns, returns] = Type.Parse(token_group.Next);
    after_returns.Expect("]");

    return [
      after_returns.Next,
      new IterableType(token_group.CodeLocation, returns),
    ];
  },
});
