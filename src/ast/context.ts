import { LinkedExpression } from "../linked-ast/expression/base";
import { LinkedAllocateStatement } from "../linked-ast/statement/allocate";
import { LinkedType } from "../linked-ast/type/base";
import { LinkerError } from "../linker/error";
import { EmptyCodeLocation } from "../location/empty";
import { Callstack } from "./callstack";
import { CodeBase } from "./code-base";
import { ContextResponse } from "./context-response";
import { FunctionEntity } from "./entity/function";
import { Namespace } from "./namespace";
import { Scope } from "./scope";

export class Context {
  readonly #code_base: CodeBase;
  readonly #namespace: Namespace;
  readonly #scope: Scope;
  readonly #callstack: Callstack;

  constructor(
    code_base: CodeBase,
    namespace: Namespace,
    scope: Scope,
    callstack: Callstack
  ) {
    this.#code_base = code_base;
    this.#namespace = namespace;
    this.#scope = scope;
    this.#callstack = callstack;
  }

  GetNamespace(name: string) {
    const namespace = this.#code_base.GetNamespace(name);
    if (!namespace)
      throw new LinkerError(
        EmptyCodeLocation,
        "error",
        `Could not find namespace with name ${name}`
      );

    return namespace;
  }

  PrepareInvokation(args: Array<LinkedExpression>) {
    return new Context(
      this.#code_base,
      this.#namespace,
      this.#scope,
      this.#callstack.PrepareInvokation(args)
    );
  }

  WithoutInvokation() {
    return new Context(
      this.#code_base,
      this.#namespace,
      this.#scope,
      new Callstack([], [], 0)
    );
  }

  WithParameterIndex(index: number) {
    return new Context(
      this.#code_base,
      this.#namespace,
      this.#scope,
      this.#callstack.WithParameterIndex(index)
    );
  }

  EnterFunction(func: FunctionEntity) {
    const namespace = this.#code_base.GetNamespaceForFunc(func);
    if (!namespace)
      throw new LinkerError(
        EmptyCodeLocation,
        "error",
        `Could not find namespace for function ${func.Name}`
      );

    return new Context(
      this.#code_base,
      namespace,
      this.#scope.EnterFunction(func),
      this.#callstack.EnterFunction(func)
    );
  }

  WithType(name: string, type: LinkedType) {
    return new Context(
      this.#code_base,
      this.#namespace,
      this.#scope.WithType(name, type),
      this.#callstack
    );
  }

  WithObject(name: string, value: LinkedExpression) {
    return new Context(
      this.#code_base,
      this.#namespace,
      this.#scope.WithObject(name, value),
      this.#callstack
    );
  }

  WithMake(make: LinkedAllocateStatement) {
    return new Context(
      this.#code_base,
      this.#namespace,
      this.#scope.WithMake(make),
      this.#callstack
    );
  }

  GetMake() {
    return this.#scope.GetMake();
  }

  GetObject(name: string) {
    const scoped = this.#scope.GetObject(name);
    if (scoped) return new ContextResponse(this, scoped);

    return this.#namespace.GetObject(name, this);
  }

  GetType(name: string) {
    const scoped = this.#scope.GetType(name);
    if (scoped) return new ContextResponse(this, scoped);

    return this.#namespace.GetType(name, this);
  }

  GetCurrentParameter() {
    return this.#callstack.GetCurrentParameter();
  }

  Build<TData extends Record<string, any>, TResponse>(
    actions: {
      [TKey in keyof TData]: (context: Context) => ContextResponse<TData[TKey]>;
    },
    builder: (
      data: TData,
      context: Context
    ) => TResponse | ContextResponse<TResponse>
  ): ContextResponse<TResponse> {
    let context: Context = this;
    const data: Partial<TData> = {};
    for (const key in actions) {
      const response = actions[key](context);
      context = response.Context;
      data[key] = response.Response;
    }

    const result = builder(data as TData, context);
    if (result instanceof ContextResponse) return result;
    return new ContextResponse(context, result);
  }

  Map<TItem, TResult>(
    input: TItem[],
    mapper: (
      context: Context,
      item: TItem,
      index: number
    ) => ContextResponse<TResult>
  ) {
    return input.reduce((ctx, n, i) => {
      const result = mapper(ctx.Context, n, i);

      return new ContextResponse(result.Context, [
        ...ctx.Response,
        result.Response,
      ]);
    }, new ContextResponse(this, [] as Array<TResult>));
  }
}
