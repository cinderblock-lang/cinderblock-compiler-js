import { CodeLocation } from "../../location/code-location";
import { Entity, EntityOptions } from "./base";

export class UsingEntity extends Entity {
  readonly #name: string;

  constructor(ctx: CodeLocation, options: EntityOptions, name: string) {
    super(ctx, options);
    this.#name = name;
  }

  get Name() {
    return this.#name;
  }
}

Entity.Register({
  Is(token_group) {
    return token_group.Text === "using";
  },
  Extract(token_group, options) {
    token_group = token_group.Next;
    let name = token_group.Text;
    token_group = token_group.Next;

    while (token_group.Text !== ";") {
      name += token_group.Text;
      token_group = token_group.Next;
      name += token_group.Text;
      token_group = token_group.Next;
    }

    return [
      token_group.Next,
      new UsingEntity(token_group.CodeLocation, options, name),
    ];
  },
});
