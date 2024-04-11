import { Component } from "../ast/component";
import { ExternalFunctionEntity } from "../ast/entity/external-function";
import { FunctionEntity } from "../ast/entity/function";
import { SchemaEntity } from "../ast/entity/schema";
import { StructEntity } from "../ast/entity/struct";
import { Parameter } from "../ast/parameter";
import { SubStatement } from "../ast/statement/sub";
import { PrimitiveType } from "../ast/type/primitive";
import { SchemaType } from "../ast/type/schema";
import { UseType } from "../ast/type/use";

type AnyStructLike = StructEntity | SchemaEntity | SchemaType;

export function IsAnyStructLike(target: Component): target is AnyStructLike {
  return (
    target instanceof StructEntity ||
    target instanceof SchemaEntity ||
    target instanceof SchemaType
  );
}

type AnyInvokable =
  | FunctionEntity
  | Parameter
  | SubStatement
  | ExternalFunctionEntity;

export function IsAnyInvokable(
  target: Component | undefined
): target is AnyInvokable {
  return (
    target instanceof FunctionEntity ||
    target instanceof SubStatement ||
    target instanceof Parameter ||
    target instanceof ExternalFunctionEntity
  );
}

export function IsAny(target: Component) {
  return (
    (target instanceof PrimitiveType && target.Name === "any") ||
    target instanceof UseType
  );
}
