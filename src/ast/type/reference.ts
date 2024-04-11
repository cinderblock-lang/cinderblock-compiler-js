import { CodeLocation } from "../../location/code-location";
import { Type } from "./base";

export class ReferenceType extends Type {
  readonly #name: string;

  constructor(ctx: CodeLocation, name: string) {
    super(ctx);
    this.#name = name;
  }
}

Type.Register({
  Priority: 0,
  Is(token_group) {
    return true;
  },
  Extract(token_group) {
    const name = token_group.Text;
    return [
      token_group.Next,
      new ReferenceType(token_group.CodeLocation, name),
    ];
  },
});
