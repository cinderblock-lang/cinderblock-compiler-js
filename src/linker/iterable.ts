import { Component } from "../ast/component";
import { StructEntity } from "../ast/entity/struct";
import { FunctionType } from "../ast/type/function";
import { RequireType } from "../location/require-type";
import { LinkerError } from "./error";

export function GetIterableFunctionStruct(target: Component) {
  RequireType(FunctionType, target);
  const iterable_struct = target.Returns;
  RequireType(StructEntity, iterable_struct);
  return iterable_struct;
}

export function GetIterableFunctionType(target: Component) {
  const iterable_struct = GetIterableFunctionStruct(target);
  const result = iterable_struct.GetKey("result");

  if (!result)
    throw new LinkerError(
      iterable_struct.CodeLocation,
      "Iterable structs must have a result type"
    );

  return result.Type;
}
