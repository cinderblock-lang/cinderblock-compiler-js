import { CodeLocation } from "../../location/code-location";
import { ComponentGroup } from "../component-group";
import { Type } from "./base";

export class UseType extends Type {
  readonly #name: string;
  readonly #constraints: ComponentGroup;

  constructor(ctx: CodeLocation, name: string, constraints: ComponentGroup) {
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
    token_group.Expect("use");
    const [after_options, options] = ComponentGroup.ParseWhile(
      token_group.Next,
      Type.Parse,
      ["="]
    );

    const name = after_options.Next.Text;

    return [
      after_options.Skip(2),
      new UseType(token_group.CodeLocation, name, options),
    ];
  },
});
