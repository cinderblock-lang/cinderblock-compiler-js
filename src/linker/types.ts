import {
  BuiltInFunction,
  Component,
  ExternalFunctionDeclaration,
  FunctionEntity,
  FunctionParameter,
  SchemaEntity,
  SchemaType,
  StoreStatement,
  StructEntity,
} from "#compiler/ast";

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
  | ExternalFunctionDeclaration
  | FunctionParameter
  | StoreStatement;

export function IsAnyInvokable(
  target: Component | undefined
): target is AnyInvokable {
  return (
    target instanceof FunctionEntity ||
    target instanceof BuiltInFunction ||
    target instanceof ExternalFunctionDeclaration ||
    target instanceof StoreStatement ||
    target instanceof FunctionParameter
  );
}
