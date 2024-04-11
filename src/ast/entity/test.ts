import { CodeLocation } from "../../location/code-location";
import { ComponentGroup } from "../component-group";
import { PrimitiveType } from "../type/primitive";
import { Entity, EntityOptions } from "./base";
import { FunctionEntity } from "./function";

export class TestEntity extends FunctionEntity {
  readonly #description: string;

  constructor(
    ctx: CodeLocation,
    options: EntityOptions,
    description: string,
    content: ComponentGroup
  ) {
    super(
      ctx,
      { ...options, unsafe: true },
      Buffer.from(description).toString("base64").replace(/=/gm, ""),
      new ComponentGroup(),
      content,
      new PrimitiveType(ctx, "bool")
    );

    this.#description = description;
  }
}

Entity.Register({
  Is(token_group) {
    return token_group.Text === "test";
  },
  Extract(token_group, options) {
    const name = token_group.Next.Text;

    let body: ComponentGroup;
    [token_group, body] = ComponentGroup.ParseOptionalExpression(token_group);

    return [
      token_group,
      new TestEntity(token_group.CodeLocation, options, name, body),
    ];
  },
});
