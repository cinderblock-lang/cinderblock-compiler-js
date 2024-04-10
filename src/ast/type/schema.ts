import { CodeLocation } from "../../location/code-location";
import { ComponentGroup } from "../component-group";
import { Property } from "../property";
import { Type } from "./base";

export class SchemaType extends Type {
  readonly #properties: ComponentGroup;

  constructor(ctx: CodeLocation, properties: ComponentGroup) {
    super(ctx);
    this.#properties = properties;
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
