import { CodeLocation } from "../../location/code-location";
import { ComponentGroup } from "../component-group";
import { Type } from "./base";

export class UseType extends Type {
  readonly #name: string;
  readonly #constraints: ComponentGroup;

  constructor(ctx: CodeLocation, name: string, constraints: ComponentGroup) {
    super(ctx);
    this.#name = name;
    this.#constraints = constraints;
  }
}
