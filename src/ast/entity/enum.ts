import { LinkedEnumType } from "../../linked-ast/type/enum";
import { LinkerError } from "../../linker/error";
import { CodeLocation } from "../../location/code-location";
import { TokenGroupResponse } from "../../parser/token-group-response";
import { Context } from "../context";
import { PropertyCollection } from "../property-collection";
import { Entity, EntityOptions } from "./base";
import { TypeEntity } from "./type-entity";

export class EnumEntity extends TypeEntity {
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

  get Keys() {
    return this.#properties.Keys;
  }

  Linked(context: Context) {
    const invoked_with = context.GetCurrentParameter();
    if (invoked_with) {
      const invoked_type = invoked_with.Type;
      if (!(invoked_type instanceof LinkedEnumType))
        throw new LinkerError(
          this.CodeLocation,
          "error",
          "Attempting to invoke with the incorrect type"
        );

      if (invoked_type.CName !== this.CodeLocation.CName)
        throw new LinkerError(
          this.CodeLocation,
          "error",
          "Attempting to invoke with the incorrect type"
        );
    }

    return context.Build(
      {
        properties: (c) => this.#properties.Linked(c.WithoutInvokation()),
      },
      ({ properties }) => new LinkedEnumType(this.CodeLocation, properties)
    );
  }
}

Entity.Register({
  Is(token_group) {
    return token_group.Text === "enum";
  },
  Extract(token_group, options) {
    return token_group.Build(
      {
        name: (token_group) => {
          token_group = token_group.Next;
          return TokenGroupResponse.TextItem(token_group);
        },
        properties: (token_group) => {
          token_group.Expect("{");
          return PropertyCollection.Parse(token_group.Next);
        },
      },
      ({ name, properties }) =>
        new EnumEntity(token_group.CodeLocation, options, name, properties)
    );
  },
});
