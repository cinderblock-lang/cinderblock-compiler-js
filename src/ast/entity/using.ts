import { CodeLocation } from "../../location/code-location";
import { TokenGroupResponse } from "../../parser/token-group-response";
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
    return token_group.Build(
      {
        name: (token_group) =>
          token_group.Next.Until(
            (token_group) => TokenGroupResponse.TextItem(token_group),
            ";"
          ),
      },
      ({ name }) =>
        new UsingEntity(token_group.CodeLocation, options, name.join(""))
    );
  },
});
