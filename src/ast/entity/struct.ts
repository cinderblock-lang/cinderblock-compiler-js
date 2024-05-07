import { LinkedStructType } from "../../linked-ast/type/struct";
import { LinkerError } from "../../linker/error";
import { CodeLocation } from "../../location/code-location";
import { Context } from "../context";
import { PropertyCollection } from "../property-collection";
import { Entity, EntityOptions } from "./base";
import { TypeEntity } from "./type-entity";

export class StructEntity extends TypeEntity {
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
    if (invoked_with) {
      const invoked_type = invoked_with.Type;
      if (!(invoked_type instanceof LinkedStructType))
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
      ({ properties }) => new LinkedStructType(this.CodeLocation, properties)
    );
  }
}

Entity.Register({
  Is(token_group) {
    return token_group.Text === "struct";
  },
  Extract(token_group, options) {
    const name = token_group.Next.Text;
    token_group = token_group.Skip(2);
    token_group.Expect("{");
    const [after_properties, properties] = PropertyCollection.Parse(
      token_group.Next
    );

    return [
      after_properties,
      new StructEntity(token_group.CodeLocation, options, name, properties),
    ];
  },
});
