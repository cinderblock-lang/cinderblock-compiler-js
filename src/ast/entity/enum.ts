import { IConcreteType, Scope } from "../../linker/closure";
import { CodeLocation } from "../../location/code-location";
import { WriterStruct } from "../../writer/entity";
import { WriterFile } from "../../writer/file";
import { PropertyCollection } from "../property-collection";
import { Entity, EntityOptions } from "./base";

export class EnumEntity extends Entity implements IConcreteType {
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

  Declare(file: WriterFile, scope: Scope): WriterFile {
    return file.WithEntity(
      new WriterStruct(this.CName, this.#properties.Build(scope))
    );
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
