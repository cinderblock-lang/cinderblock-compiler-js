import { LinkedType } from "../../linked-ast/type/base";
import { Context } from "../context";
import { ContextResponse } from "../context-response";
import { Entity } from "./base";

export abstract class TypeEntity extends Entity {
  abstract Linked(context: Context): ContextResponse<LinkedType>;
}
