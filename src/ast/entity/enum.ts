import { LinkedPropertyCollection } from "../../linked-ast/property-collection";
import { LinkedType } from "../../linked-ast/type/base";
import { LinkedEnumType } from "../../linked-ast/type/enum";
import { CodeLocation } from "../../location/code-location";
import { Callstack } from "../callstack";
import { Context } from "../context";
import { ContextResponse } from "../context-response";
import { PropertyCollection } from "../property-collection";
import { Scope } from "../scope";
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
    return context.Build(
      {
        properties: this.#properties.Linked,
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
    const name = token_group.Next.Text;
    token_group = token_group.Skip(2);
    token_group.Expect("{");
    const [after_properties, properties] = PropertyCollection.Parse(
      token_group.Next
    );

    return [
      after_properties,
      new EnumEntity(token_group.CodeLocation, options, name, properties),
    ];
  },
});
