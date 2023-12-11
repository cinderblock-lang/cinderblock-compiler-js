import { Component } from "../ast/component";
import { BuiltInFunction } from "../ast/entity/built-in-function";
import { FunctionEntity } from "../ast/entity/function";
import { SchemaEntity } from "../ast/entity/schema";
import { StructEntity } from "../ast/entity/struct";
import { FunctionParameter } from "../ast/function-parameter";
import { StoreStatement } from "../ast/statement/store";
import { SchemaType } from "../ast/type/schema";

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
  | BuiltInFunction
  | FunctionParameter
  | StoreStatement;

export function IsAnyInvokable(
  target: Component | undefined
): target is AnyInvokable {
  return (
    target instanceof FunctionEntity ||
    target instanceof BuiltInFunction ||
    target instanceof StoreStatement ||
    target instanceof FunctionParameter
  );
}
