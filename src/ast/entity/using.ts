import { Scope } from "../../linker/closure";
import { LinkerError } from "../../linker/error";
import { CodeLocation } from "../../location/code-location";
import { WriterEntity } from "../../writer/entity";
import { WriterFile } from "../../writer/file";
import { Entity, EntityOptions } from "./base";

export class UsingEntity extends Entity {
  readonly #name: string;

  constructor(ctx: CodeLocation, options: EntityOptions, name: string) {
    super(ctx, options);
    this.#name = name;
  }

  Declare(file: WriterFile, scope: Scope): [WriterFile, WriterEntity] {
    throw new LinkerError(
      this.CodeLocation,
      "error",
      "This should not be reachable"
    );
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
      token_group,
      new UsingEntity(token_group.CodeLocation, options, name),
    ];
  },
});
