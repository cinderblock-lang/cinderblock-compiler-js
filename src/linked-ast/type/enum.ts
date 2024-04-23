import { CodeLocation } from "../../location/code-location";
import { PropertyCollection } from "../property-collection";
import { Type } from "./base";

export class EnumType extends Type {
  readonly #name: string;
  readonly #properties: PropertyCollection;

  constructor(ctx: CodeLocation, name: string, properties: PropertyCollection) {
    super(ctx);
    this.#name = name;
    this.#properties = properties;
  }
}
