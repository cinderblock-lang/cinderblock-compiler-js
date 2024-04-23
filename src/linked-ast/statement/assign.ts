import { CodeLocation } from "../../location/code-location";
import { LinkedExpression } from "../expression/base";
import { MakeExpression } from "../expression/make";
import { Property } from "../property";
import { LinkedStatement } from "./base";

export class AssignStatement extends LinkedStatement {
  readonly #name: string;
  readonly #equals: LinkedExpression;
  readonly #target: MakeExpression;
  readonly #property: Property;

  constructor(
    ctx: CodeLocation,
    name: string,
    equals: LinkedExpression,
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
