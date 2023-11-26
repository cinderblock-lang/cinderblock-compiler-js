import { BuiltInFunction } from "./entity/built-in-function";
import { ExternalFunctionDeclaration } from "./entity/external-function-declaration";
import { FunctionEntity } from "./entity/function";
import { SchemaEntity } from "./entity/schema";
import { StructEntity } from "./entity/struct";
import { InvokationExpression } from "./expression/invokation";
import { Type } from "./type/base";

export interface CFile {
  add_global(data: string): void;
  add_include(data: string): void;
}

export type AnyFunction =
  | FunctionEntity
  | ExternalFunctionDeclaration
  | BuiltInFunction;

export type AnyType = StructEntity | SchemaEntity;

export type WriterContext = {
  global_functions: Record<string, AnyFunction>;
  global_types: Record<string, AnyType>;

  namespace: string;
  using: Array<string>;
  parameters: Record<string, Type>;
  locals: Record<string, Type>;

  use_types: Record<string, Type>;

  invokation?: InvokationExpression;

  file: CFile;

  prefix: Array<string>;
  suffix: Array<string>;
};
