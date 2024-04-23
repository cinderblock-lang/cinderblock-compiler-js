import { CodeLocation } from "../../location/code-location";
import { PropertyCollection } from "../property-collection";
import { LinkedType } from "./base";

export class EnumType extends LinkedType {
  readonly #name: string;
  readonly #properties: PropertyCollection;

  constructor(ctx: CodeLocation, name: string, properties: PropertyCollection) {
    super(ctx);
    this.#name = name;
    this.#properties = properties;
  }
}
