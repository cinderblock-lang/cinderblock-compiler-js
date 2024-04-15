import { Scope } from "../../linker/closure";
import { LinkerError } from "../../linker/error";
import { CodeLocation } from "../../location/code-location";
import { WriterFile } from "../../writer/file";
import { Closure } from "../closure";
import { ParameterCollection } from "../parameter-collection";
import { PrimitiveType } from "../type/primitive";
import { Entity, EntityOptions } from "./base";
import { FunctionEntity } from "./function";

export class TestEntity extends FunctionEntity {
  readonly #description: string;

  constructor(
    ctx: CodeLocation,
    options: EntityOptions,
    description: string,
    content: Closure
  ) {
    super(
      ctx,
      { ...options, unsafe: true },
      Buffer.from(description).toString("base64").replace(/=/gm, ""),
      new ParameterCollection(),
      content,
      new PrimitiveType(ctx, "bool")
    );

    this.#description = description;
  }

  Declare(file: WriterFile, scope: Scope): WriterFile {
    throw new LinkerError(
      this.CodeLocation,
      "error",
      "Tests not yet implemented"
    );
  }
}

Entity.Register({
  Is(token_group) {
    return token_group.Text === "test";
  },
  Extract(token_group, options) {
    const name = token_group.Next.Text;

    let body: Closure;
    [token_group, body] = Closure.Parse(token_group);

    return [
      token_group,
      new TestEntity(token_group.CodeLocation, options, name, body),
    ];
  },
});
