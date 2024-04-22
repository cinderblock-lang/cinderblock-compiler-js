import type { Ast } from "../ast";
import { IConcreteType, IDiscoverableType, IInstance } from "../ast/component";
import { FunctionEntity } from "../ast/entity/function";
import { LambdaExpression } from "../ast/expression/lambda";
import { EmptyCodeLocation } from "../location/empty";
import { LinkerError } from "./error";

export type ClosureContext = {
  parameters: Array<IConcreteType>;
  scope: Scope;
};

export interface IClosure {
  Resolve(name: string, ctx: ClosureContext): Array<IInstance>;
  ResolveType(name: string, ctx: ClosureContext): Array<IConcreteType>;
  DiscoverType(name: string, ctx: ClosureContext): Array<IDiscoverableType>;
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

  get Namespace() {
    return this.#ast.GetNamespaceForFunction(this.#func);
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

  ResetTo(closure: IClosure) {
    return new Scope(
      this.#ast,
      [[closure, this.#prepared_parameters]],
      this.#prepared_parameters
    );
  }

  Resolve(name: string) {
    let result: Array<IInstance> = [];
    for (const [closure, parameters] of this.#closures) {
      result = [
        ...result,
        ...closure.Resolve(name, { parameters, scope: this }),
      ];
    }

    const namespace = this.#ast.GetNamespaceForFunction(this.#func);

    return [...result, ...namespace.Resolve(name, this.#ast)];
  }

  ResolveType(name: string) {
    for (const [closure, parameters] of this.#closures.reverse()) {
      const result = closure.ResolveType(name, { parameters, scope: this });
      if (result) return result;
    }

    const namespace = this.#ast.GetNamespaceForFunction(this.#func);

    return namespace.ResolveType(name, this.#ast);
  }

  DiscoverType(name: string) {
    for (const [closure, parameters] of this.#closures.reverse()) {
      const result = closure.DiscoverType(name, { parameters, scope: this });
      if (result) return result;
    }

    const namespace = this.#ast.GetNamespaceForFunction(this.#func);

    return namespace.DiscoverType(name, this.#ast);
  }

  get #current_func() {
    const allowed = [FunctionEntity, LambdaExpression] as const;
    const result = [...this.#closures]
      .reverse()
      .find(([c]) => !!allowed.find((a) => c instanceof a));

    if (!result)
      throw new LinkerError(EmptyCodeLocation, "error", "Not in function");

    return result;
  }

  IsCurrentLevel(name: string) {
    const [closure, parameters] = this.#current_func;
    const result = closure.Resolve(name, { parameters, scope: this });
    if (result) return true;
    return false;
  }
}
