import { CodeLocation } from "../../location/code-location";
import { Expression } from "../expression/base";
import { MakeExpression } from "../expression/make";
import { Property } from "../property";
import { Statement } from "./base";

export class AssignStatement extends Statement {
  readonly #name: string;
  readonly #equals: Expression;
  readonly #target: MakeExpression;
  readonly #property: Property;

  constructor(
    ctx: CodeLocation,
    name: string,
    equals: Expression,
    target: MakeExpression,
    property: Property
  ) {
    super(ctx);
    this.#name = name;
    this.#equals = equals;
    this.#target = target;
    this.#property = property;
  }
}
