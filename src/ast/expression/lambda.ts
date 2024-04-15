import { Expression } from "./base";
import { CodeLocation } from "../../location/code-location";
import { Namer } from "../../location/namer";
import { Type } from "../type/base";
import { Closure } from "../closure";
import {
  ClosureContext,
  IClosure,
  IConcreteType,
  IInstance,
  Scope,
} from "../../linker/closure";
import { ParameterCollection } from "../parameter-collection";
import {
  WriterExpression,
  WriterFunctionReferenceExpression,
} from "../../writer/expression";
import { WriterFile } from "../../writer/file";
import { FunctionType } from "../type/function";
import { WriterFunction, WriterProperty } from "../../writer/entity";
import { WriterType } from "../../writer/type";
import { WriterStatement } from "../../writer/statement";

export class LambdaExpression extends Expression implements IClosure {
  readonly #parameters: ParameterCollection;
  readonly #body: Closure;
  readonly #returns: Type | undefined;

  readonly #name: string;

  constructor(
    ctx: CodeLocation,
    parameters: ParameterCollection,
    body: Closure,
    returns: Type | undefined
  ) {
    super(ctx);
    this.#parameters = parameters;
    this.#body = body;
    this.#returns = returns;

    this.#name = Namer.GetName();
  }

  ResolveType(name: string, ctx: ClosureContext): IConcreteType | undefined {
    return this.#parameters.ResolveType(name, ctx.parameters);
  }

  Resolve(name: string): IInstance | undefined {
    return this.#parameters.Resolve(name);
  }

  Build(
    file: WriterFile,
    func: WriterFunction,
    scope: Scope
  ): [WriterFile, WriterFunction, WriterExpression] {
    let parameters: Array<WriterProperty>;
    [file, parameters] = this.ResolvesTo(scope.With(this)).Parameters.Build(
      file,
      scope
    );

    let type: WriterType;
    [file, type] = this.ResolvesTo(scope.With(this)).Returns.Build(file, scope);

    let main_func = new WriterFunction(this.CName, [], type, [], func);
    let main_statements: Array<WriterStatement>;
    [file, main_func, main_statements] = this.#body.Build(
      file,
      main_func,
      scope.With(this)
    );
    file = file.WithEntity(main_func.WithStatements(main_statements));

    return [file, func, new WriterFunctionReferenceExpression(main_func)];
  }

  ResolvesTo(scope: Scope): FunctionType {
    return new FunctionType(
      this.CodeLocation,
      this.#parameters,
      this.#returns ?? this.#body.ResolvesTo(scope.With(this))
    );
  }
}

Expression.Register({
  Priority: 3,
  Is(token_group, prefix) {
    return token_group.Text === "fn";
  },
  Extract(token_group, prefix) {
    token_group.Next.Expect("(");
    const [after_parameters, parameters] = ParameterCollection.Parse(
      token_group.Next
    );

    const [after_returns, returns] =
      after_parameters.Text === ":"
        ? Type.Parse(after_parameters.Next)
        : ([after_parameters, undefined] as const);

    after_returns.Expect("->");

    const [after_body, body] = Closure.Parse(after_returns.Next);

    return [
      after_body,
      new LambdaExpression(token_group.CodeLocation, parameters, body, returns),
    ];
  },
});
