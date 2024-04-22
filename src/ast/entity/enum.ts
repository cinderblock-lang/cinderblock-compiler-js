import { Scope } from "../../linker/closure";
import { CodeLocation } from "../../location/code-location";
import { WriterProperty, WriterStruct } from "../../writer/entity";
import { WriterFile } from "../../writer/file";
import {
  IConcreteType,
  IDiscoverableType,
  ConcreteId,
  DiscoverableTypeId,
} from "../component";
import { PropertyCollection } from "../property-collection";
import { Entity, EntityOptions } from "./base";

export class EnumEntity
  extends Entity
  implements IConcreteType, IDiscoverableType
{
  readonly #name: string;
  readonly #properties: PropertyCollection;

  readonly [ConcreteId] = true;
  readonly [DiscoverableTypeId] = true;

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

  Declare(file: WriterFile, scope: Scope): [WriterFile, WriterStruct] {
    let properties: Array<WriterProperty>;
    [file, properties] = this.#properties.Build(file, scope);
    const result = new WriterStruct(this.CName, properties);

    return [file.WithEntity(result), result];
  }

  get TypeName(): string {
    return this.CName;
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
