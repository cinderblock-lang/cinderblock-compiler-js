import { LinkerError } from "../../linker/error";
import { CodeLocation } from "../../location/code-location";
import { Context } from "../context";
import { Type } from "./base";

export class ReferenceType extends Type {
  readonly #name: string;

  constructor(ctx: CodeLocation, name: string) {
    super(ctx);
    this.#name = name;
  }

  Linked(context: Context) {
    const referencing = context.GetType(this.#name);
    if (!referencing)
      throw new LinkerError(
        this.CodeLocation,
        "error",
        "Could not resolve reference"
      );

    return referencing;
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
