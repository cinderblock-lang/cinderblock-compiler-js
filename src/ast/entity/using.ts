import { CodeLocation } from "../../location/code-location";
import { Entity } from "./base";

export class UsingEntity extends Entity {
  readonly #name: string;

  constructor(ctx: CodeLocation, exported: boolean, name: string) {
    super(ctx, exported);
    this.#name = name;
  }
}
