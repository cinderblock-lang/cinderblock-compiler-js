import { Expression } from "./base";
import { ComponentGroup } from "../component-group";
import { CodeLocation } from "../../location/code-location";

export class MakeExpression extends Expression {
  readonly #struct: string;
  readonly #using: ComponentGroup;

  constructor(ctx: CodeLocation, struct: string, using: ComponentGroup) {
    super(ctx);
    this.#struct = struct;
    this.#using = using;
  }
}
