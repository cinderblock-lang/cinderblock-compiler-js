import { Expression } from "./base";
import { ComponentGroup } from "../component-group";
import { CodeLocation } from "../../location/code-location";

export class PickExpression extends Expression {
  readonly #enum: Expression;
  readonly #key: string;
  readonly #using: ComponentGroup;

  constructor(
    ctx: CodeLocation,
    target: Expression,
    key: string,
    using: ComponentGroup
  ) {
    super(ctx);
    this.#enum = target;
    this.#key = key;
    this.#using = using;
  }
}
