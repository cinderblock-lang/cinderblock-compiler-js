import {
  ClosureContext,
  IClosure,
  IConcreteType,
  IDiscoverableType,
  IInstance,
  InstanceId,
  Scope,
} from "../../linker/closure";
import { CodeLocation } from "../../location/code-location";
import { WriterFunction, WriterProperty } from "../../writer/entity";
import { WriterFile } from "../../writer/file";
import { WriterStatement } from "../../writer/statement";
import { WriterType } from "../../writer/type";
import { Block } from "../block";
import { ParameterCollection } from "../parameter-collection";
import { Type } from "../type/base";
import { FunctionType } from "../type/function";
import { Entity, EntityOptions } from "./base";

export class FunctionEntity extends Entity implements IClosure, IInstance {
  readonly #name: string;
  readonly #parameters: ParameterCollection;
  readonly #content: Block;
  readonly #returns: Type | undefined;

  readonly [InstanceId] = true;

  constructor(
    ctx: CodeLocation,
    options: EntityOptions,
    name: string,
    parameters: ParameterCollection,
    content: Block,
    returns: Type | undefined
  ) {
    super(ctx, options);
    this.#name = name;
    this.#parameters = parameters;
    this.#content = content;
    this.#returns = returns;
  }

  #is_main(scope: Scope) {
    return this.#name === "main" && scope.Namespace.Name === "App";
  }

  get Parameters() {
    return this.#parameters;
  }

  get Reference(): string {
    return this.CName;
  }

  ResolveType(name: string, ctx: ClosureContext): Array<IConcreteType> {
    return [this.#parameters.ResolveType(name, ctx.parameters)].filter(
      (c) => !!c
    ) as any;
  }

  DiscoverType(name: string, ctx: ClosureContext): IDiscoverableType[] {
    return [this.#parameters.DiscoverType(name)].filter((c) => !!c) as any;
  }

  get Name() {
    return this.#name;
  }

  Resolve(name: string): Array<IInstance> {
    return [
      ...this.#content.Resolve(name),
      this.#parameters.Resolve(name),
    ].filter((c) => !!c) as any;
  }

  Declare(file: WriterFile, scope: Scope): [WriterFile, WriterFunction] {
    scope = scope.ResetTo(this);
    let parameters: Array<WriterProperty>;
    [file, parameters] = this.#parameters.Build(file, scope);
    let returns: WriterType;
    [file, returns] = (this.#returns ?? this.#content.ResolvesTo(scope)).Build(
      file,
      scope
    );

    let result = new WriterFunction(
      this.#is_main(scope) ? "main" : this.CName,
      parameters,
      returns,
      []
    );

    let statements: Array<WriterStatement>;
    [file, result, statements] = this.#content.Build(file, result, scope);
    result = result.WithStatements(statements);
    return [file.WithEntity(result), result];
  }

  ResolvesTo(scope: Scope): Type {
    return new FunctionType(
      this.CodeLocation,
      this.#parameters,
      this.#returns ?? this.#content.ResolvesTo(scope)
    );
  }
}

Entity.Register({
  Is(token_group) {
    return token_group.Text === "fn";
  },
  Extract(token_group, options) {
    const name = token_group.Next.Text;
    token_group = token_group.Skip(2);

    token_group.Expect("(");
    token_group = token_group.Next;

    let parameters: ParameterCollection;
    [token_group, parameters] = ParameterCollection.Parse(token_group);

    let returns: undefined | Type = undefined;
    if (token_group.Text === ":") {
      [token_group, returns] = Type.Parse(token_group.Next);
    }

    let body: Block;
    [token_group, body] = Block.Parse(token_group);

    return [
      token_group,
      new FunctionEntity(
        token_group.CodeLocation,
        options,
        name,
        parameters,
        body,
        returns
      ),
    ];
  },
});
