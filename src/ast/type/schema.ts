import { LinkedType } from "../../linked-ast/type/base";
import { LinkerError } from "../../linker/error";
import { CodeLocation } from "../../location/code-location";
import { Context } from "../context";
import { ContextResponse } from "../context-response";
import { PropertyCollection } from "../property-collection";
import { Type } from "./base";

export class SchemaType extends Type {
  readonly #properties: PropertyCollection;

  constructor(ctx: CodeLocation, properties: PropertyCollection) {
    super(ctx);
    this.#properties = properties;
  }

  HasKey(key: string) {
    return !!this.#properties.Resolve(key);
  }

  GetKey(key: string) {
    return this.#properties.Resolve(key);
  }

  get Properties() {
    return this.#properties;
  }

  Linked(context: Context) {
    const invoked_with = context.GetCurrentParameter();
    if (!invoked_with)
      throw new LinkerError(
        this.CodeLocation,
        "error",
        "Could not resolve schema"
      );

    return new ContextResponse(context, invoked_with.Type);
  }

  IsGeneric(context: Context): boolean {
    return true;
  }
}

Type.Register({
  Priority: 1,
  Is(token_group) {
    return token_group.Text === "schema";
  },
  Extract(token_group) {
    token_group.Expect("schema");
    token_group.Next.Expect("{");
    const [after_properties, properties] = PropertyCollection.Parse(
      token_group.Skip(2)
    );

    return [
      after_properties,
      new SchemaType(token_group.CodeLocation, properties),
    ];
  },
});
