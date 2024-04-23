import { CodeLocation } from "../../location/code-location";
import { PropertyCollection } from "../property-collection";
import { Type } from "./base";

export class StructType extends Type {
  readonly #name: string;
  readonly #properties: PropertyCollection;

  constructor(ctx: CodeLocation, name: string, properties: PropertyCollection) {
    super(ctx);
    this.#name = name;
    this.#properties = properties;
  }

  GetKey(name: string) {
    return this.#properties.GetKey(name);
  }
}
