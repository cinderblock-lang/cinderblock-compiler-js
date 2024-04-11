import { CodeLocation } from "../../location/code-location";
import { ComponentGroup } from "../component-group";
import { Property } from "../property";
import { Entity, EntityOptions } from "./base";

export class StructEntity extends Entity {
  readonly #name: string;
  readonly #properties: ComponentGroup;

  constructor(
    ctx: CodeLocation,
    options: EntityOptions,
    name: string,
    properties: ComponentGroup
  ) {
    super(ctx, options);
    this.#name = name;
    this.#properties = properties;
  }

  get Name() {
    return this.#name;
  }

  get Properties() {
    return this.#properties;
  }

  HasKey(key: string) {
    for (const property of this.#properties.iterator())
      if (property instanceof Property) if (property.Name === key) return true;

    return false;
  }

  GetKey(key: string) {
    for (const property of this.#properties.iterator())
      if (property instanceof Property)
        if (property.Name === key) return property;

    return undefined;
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
    const [after_properties, properties] = ComponentGroup.ParseWhile(
      token_group.Next,
      Property.Parse,
      ["}"]
    );

    return [
      after_properties,
      new StructEntity(token_group.CodeLocation, options, name, properties),
    ];
  },
});
