import type { Ast } from "../ast";
import { Component } from "../ast/component";
import { FunctionEntity } from "../ast/entity/function";
import { EmptyCodeLocation } from "../location/empty";
import { LinkerError } from "./error";

export interface IInstance {
  get CName(): string;
  get Reference(): string;
}

export function IsInstance(input: unknown): input is IInstance {
  return input instanceof Component && "Reference" in input;
}

export interface IConcreteType {
  get CName(): string;
  get TypeName(): string;
}

export function IsConcreteType(input: unknown): input is IConcreteType {
  return input instanceof Component && "TypeName" in input;
}

export type ClosureContext = {
  parameters: Array<IConcreteType>;
  scope: Scope;
};

export interface IClosure {
  Resolve(name: string, ctx: ClosureContext): IInstance | undefined;
  ResolveType(name: string, ctx: ClosureContext): IConcreteType | undefined;
}

export class Scope {
  readonly #ast: Ast;
  readonly #prepared_parameters: Array<IConcreteType> = [];
  readonly #closures: Array<[IClosure, Array<IConcreteType>]>;

  constructor(
    ast: Ast,
    closures: Array<[IClosure, Array<IConcreteType>]>,
    prepared_parameters: Array<IConcreteType>
  ) {
    this.#ast = ast;
    this.#closures = closures;
    this.#prepared_parameters = prepared_parameters;
  }

  get #func() {
    const [result] =
      this.#closures.find(([c]) => c instanceof FunctionEntity) ?? [];

    if (!(result instanceof FunctionEntity))
      throw new LinkerError(
        EmptyCodeLocation,
        "error",
        "Scope stack does not contain a function"
      );

    return result;
  }

  get Parameters(): Array<IConcreteType> {
    return (this.#closures.find((c) => !!c[1].length) ?? [[], []])[1];
  }

  WithParametersForNextClosure(parameters: Array<IConcreteType>) {
    return new Scope(this.#ast, this.#closures, parameters);
  }

  With(closure: IClosure) {
    return new Scope(
      this.#ast,
      [...this.#closures, [closure, this.#prepared_parameters]],
      this.#prepared_parameters
    );
  }

  Resolve(name: string) {
    for (const [closure, parameters] of this.#closures) {
      const result = closure.Resolve(name, { parameters, scope: this });
      if (result) return result;
    }

    const namespace = this.#ast.GetNamespaceForFunction(this.#func);

    return namespace.Resolve(name, this.#ast);
  }

  ResolveType(name: string) {
    for (const [closure, parameters] of this.#closures) {
      const result = closure.ResolveType(name, { parameters, scope: this });
      if (result) return result;
    }

    const namespace = this.#ast.GetNamespaceForFunction(this.#func);

    return namespace.ResolveType(name, this.#ast);
  }
}
