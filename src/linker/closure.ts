import { Type } from "../ast/type/base";

export interface IInstance {
  get CName(): string;
  get Reference(): string;
}

export interface IConcreteType {
  get CName(): string;
  get TypeName(): string;
}

export interface IClosure {
  Resolve(name: string): IInstance | undefined;
  ResolveType(type: Type): IConcreteType | undefined;
}
