import { Expression } from "./base";
import { CodeLocation } from "../../location/code-location";
import { Namer } from "../../location/namer";
import { Type } from "../type/base";
import { Block } from "../block";
import {
  ClosureContext,
  IClosure,
  IConcreteType,
  IDiscoverableType,
  IInstance,
  Scope,
} from "../../linker/closure";
import { ParameterCollection } from "../parameter-collection";
import {
  WriterExpression,
  WriterGlobalReferenceExpression,
} from "../../writer/expression";
import { WriterFile } from "../../writer/file";
import { FunctionType } from "../type/function";
import { WriterFunction, WriterProperty } from "../../writer/entity";
import { WriterType } from "../../writer/type";
import { WriterStatement } from "../../writer/statement";

export class LambdaExpression extends Expression implements IClosure {
  readonly #parameters: ParameterCollection;
  readonly #body: Block;
  readonly #returns: Type | undefined;

  readonly #name: string;

  constructor(
    ctx: CodeLocation,
    parameters: ParameterCollection,
    body: Block,
    returns: Type | undefined
  ) {
    super(ctx);
    this.#parameters = parameters;
    this.#body = body;
    this.#returns = returns;

    this.#name = Namer.GetName();
  }

  DiscoverType(name: string, ctx: ClosureContext): IDiscoverableType[] {
    return [this.#parameters.DiscoverType(name)].filter((c) => !!c) as any;
  }

  ResolveType(name: string, ctx: ClosureContext): Array<IConcreteType> {
    return [this.#parameters.ResolveType(name, ctx.parameters)].filter(
      (c) => !!c
    ) as any;
  }

  Resolve(name: string): Array<IInstance> {
    return [this.#parameters.Resolve(name)].filter((c) => !!c) as any;
  }

  Build(
    file: WriterFile,
    func: WriterFunction,
    scope: Scope
  ): [WriterFile, WriterFunction, WriterExpression] {
    scope = scope.With(this);
    let parameters: Array<WriterProperty>;
    [file, parameters] = this.ResolvesTo(scope).Parameters.Build(file, scope);

    let type: WriterType;
    [file, type] = this.ResolvesTo(scope).Returns.Build(file, scope);

    let main_func = new WriterFunction(this.CName, parameters, type, [], func);
    let main_statements: Array<WriterStatement>;
    [file, main_func, main_statements] = this.#body.Build(
      file,
      main_func,
      scope
    );

    main_func = main_func.WithStatements(main_statements);
    file = file.WithEntity(main_func);

    return [file, func, new WriterGlobalReferenceExpression(main_func)];
  }

  ResolvesTo(scope: Scope): FunctionType {
    scope = scope.With(this);
    return new FunctionType(
      this.CodeLocation,
      this.#parameters,
      this.#returns ?? this.#body.ResolvesTo(scope)
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
    let parameters: ParameterCollection;
    [token_group, parameters] = ParameterCollection.Parse(
      token_group.Next.Next
    );

    let returns: Type | undefined;
    [token_group, returns] =
      token_group.Text === ":"
        ? Type.Parse(token_group.Next)
        : ([token_group, undefined] as const);

    token_group.Expect("->");

    let body: Block;
    [token_group, body] = Block.Parse(token_group.Next);

    return [
      token_group,
      new LambdaExpression(token_group.CodeLocation, parameters, body, returns),
    ];
  },
});
