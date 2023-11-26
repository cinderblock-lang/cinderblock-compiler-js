import { CodeLocation } from "../../location/code-location";
import { ComponentGroup } from "../component-group";
import { Property } from "../property";
import { WriterContext } from "../writer";
import { Entity } from "./base";
import { StructEntity } from "./struct";

export class SchemaEntity extends Entity {
  readonly #name: string;
  readonly #properties: ComponentGroup;

  constructor(
    ctx: CodeLocation,
    exported: boolean,
    name: string,
    properties: ComponentGroup
  ) {
    super(ctx, exported);
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

  IsCompatible(subject: StructEntity): boolean {
    throw new Error("Not yet implemented");
  }

  get type_name() {
    return "schema_entity";
  }

  c(ctx: WriterContext): string {
    return ``;
  }
}
