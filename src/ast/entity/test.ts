import { CodeLocation } from "../../location/code-location";
import { ComponentGroup } from "../component-group";
import { PrimitiveType } from "../type/primitive";
import { FunctionEntity } from "./function";

export class TestEntity extends FunctionEntity {
  readonly #description: string;

  constructor(
    ctx: CodeLocation,
    exported: boolean,
    description: string,
    content: ComponentGroup,
    namespace: string,
    using: Array<string>
  ) {
    super(
      ctx,
      exported,
      Buffer.from(description).toString("base64").replace(/=/gm, ""),
      true,
      new ComponentGroup(),
      content,
      new PrimitiveType(ctx, "bool"),
      namespace,
      using
    );

    this.#description = description;
  }
}
