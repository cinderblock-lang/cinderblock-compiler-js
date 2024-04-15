import { Component } from "../ast/component";

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
  readonly #prepared_parameters: Array<IConcreteType> = [];
  readonly #closures: Array<[IClosure, Array<IConcreteType>]>;

  constructor(
    closures: Array<[IClosure, Array<IConcreteType>]>,
    prepared_parameters: Array<IConcreteType>
  ) {
    this.#closures = closures;
    this.#prepared_parameters = prepared_parameters;
  }

  get Parameters(): Array<IConcreteType> {
    return (this.#closures.find((c) => !!c[1].length) ?? [[], []])[1];
  }

  WithParametersForNextClosure(parameters: Array<IConcreteType>) {
    return new Scope(this.#closures, parameters);
  }

  With(closure: IClosure) {
    return new Scope(
      [...this.#closures, [closure, this.#prepared_parameters]],
      []
    );
  }

  Resolve(name: string) {
    for (const [closure, parameters] of this.#closures) {
      const result = closure.Resolve(name, { parameters, scope: this });
      if (result) return result;
    }
  }

  ResolveType(name: string) {
    for (const [closure, parameters] of this.#closures) {
      const result = closure.ResolveType(name, { parameters, scope: this });
      if (result) return result;
    }
  }
}
