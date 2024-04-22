import { Scope } from "../../linker/closure";
import { LinkerError } from "../../linker/error";
import { CodeLocation } from "../../location/code-location";
import { WriterFile } from "../../writer/file";
import { WriterType } from "../../writer/type";
import { IConcreteType } from "../component";
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

  Build(file: WriterFile, scope: Scope): [WriterFile, WriterType] {
    throw new LinkerError(
      this.CodeLocation,
      "error",
      "Cannot resolve type of schema"
    );
  }

  ResolveConcrete(scope: Scope): IConcreteType {
    throw new LinkerError(
      this.CodeLocation,
      "error",
      "Cannot resolve type of schema"
    );
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
