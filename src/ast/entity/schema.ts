import { CodeLocation } from "../../location/code-location";
import { Property } from "../property";
import { PropertyCollection } from "../property-collection";
import { Entity, EntityOptions } from "./base";

export class SchemaEntity extends Entity {
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

  HasKey(key: string) {
    return !!this.#properties.Resolve(key);
  }

  GetKey(key: string) {
    return this.#properties.Resolve(key);
  }
}

Entity.Register({
  Is(token_group) {
    return token_group.Text === "schema";
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
      new SchemaEntity(token_group.CodeLocation, options, name, properties),
    ];
  },
});
