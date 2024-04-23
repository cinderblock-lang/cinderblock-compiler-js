import { CodeLocation } from "../../location/code-location";
import { Entity } from "../entity/base";
import { Type } from "../type/base";
import { Expression } from "./base";

export class EntityExpression extends Expression {
  readonly #entity: Entity;

  constructor(ctx: CodeLocation, entity: Entity) {
    super(ctx);
    this.#entity = entity;
  }

  get Type(): Type {
    return this.#entity.Type;
  }
}
