import { CodeLocation } from "../../location/code-location";
import { Type } from "./base";

export class UseType extends Type {
  readonly #name: string;
  readonly #constraints: Array<Type>;

  constructor(ctx: CodeLocation, name: string, constraints: Array<Type>) {
    super(ctx);
    this.#name = name;
    this.#constraints = constraints;
  }
}

Type.Register({
  Priority: 1,
  Is(token_group) {
    return token_group.Text === "use";
  },
  Extract(token_group) {
    const start = token_group.CodeLocation;
    token_group.Expect("use");

    let constraints: Array<Type> = [];
    while (token_group.Text !== "=") {
      token_group = token_group.Next;
      let result: Type;
      [token_group, result] = Type.Parse(token_group);
      token_group.Expect("=", "|");
      constraints = [...constraints, result];
    }

    const name = token_group.Next.Text;

    return [token_group.Skip(2), new UseType(start, name, constraints)];
  },
});
