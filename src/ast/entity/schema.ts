import { LinkedStructType } from "../../linked-ast/type/struct";
import { LinkerError } from "../../linker/error";
import { CodeLocation } from "../../location/code-location";
import { TokenGroupResponse } from "../../parser/token-group-response";
import { Context } from "../context";
import { ContextResponse } from "../context-response";
import { PropertyCollection } from "../property-collection";
import { Entity, EntityOptions } from "./base";
import { TypeEntity } from "./type-entity";

export class SchemaEntity extends TypeEntity {
  readonly #name: string;
  readonly #properties: PropertyCollection;

  constructor(
    ctx: CodeLocation,
    options: EntityOptions,
    name: string,
    properties: PropertyCollection
  ) {
    super(ctx, options);
    this.#name = name;
    this.#properties = properties;
  }

  get Name() {
    return this.#name;
  }

  HasKey(key: string) {
    return !!this.#properties.Resolve(key);
  }

  GetKey(key: string) {
    return this.#properties.Resolve(key);
  }

  Linked(context: Context) {
    const invoked_with = context.GetCurrentParameter();
    if (!invoked_with)
      throw new LinkerError(
        this.CodeLocation,
        "error",
        "Could not resolve schema"
      );

    const invoked_type = invoked_with.Type;
    if (!(invoked_type instanceof LinkedStructType))
      throw new LinkerError(
        this.CodeLocation,
        "error",
        "May only invoke schemas with struct types"
      );

    for (const property of this.#properties.Keys)
      if (!invoked_type.GetKey(property))
        throw new LinkerError(
          this.CodeLocation,
          "error",
          "Missing key " + property
        );

    return new ContextResponse(
      context.WithType(this.#name, invoked_with.Type),
      invoked_with.Type
    );
  }
}

Entity.Register({
  Is(token_group) {
    return token_group.Text === "schema";
  },
  Extract(token_group, options) {
    return token_group.Build(
      {
        name: (token_group) => {
          token_group = token_group.Next;
          return TokenGroupResponse.TextItem(token_group);
        },
        properties: (token_group) => PropertyCollection.Parse(token_group),
      },
      ({ name, properties }) =>
        new SchemaEntity(token_group.CodeLocation, options, name, properties)
    );
  },
});
