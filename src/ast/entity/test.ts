import { Scope } from "../../linker/closure";
import { LinkerError } from "../../linker/error";
import { CodeLocation } from "../../location/code-location";
import { WriterFunction } from "../../writer/entity";
import { WriterFile } from "../../writer/file";
import { Block } from "../block";
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
    content: Block
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

  Declare(file: WriterFile, scope: Scope): [WriterFile, WriterFunction] {
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

    let body: Block;
    [token_group, body] = Block.Parse(token_group);

    return [
      token_group,
      new TestEntity(token_group.CodeLocation, options, name, body),
    ];
  },
});
