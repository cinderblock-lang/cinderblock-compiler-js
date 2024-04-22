import { Expression } from "./base";
import { CodeLocation } from "../../location/code-location";
import { Type } from "../type/base";
import { Block } from "../block";
import {
  ClosureContext,
  IClosure,
  IConcreteType,
  IDiscoverableType,
  IInstance,
  InstanceId,
  Scope,
} from "../../linker/closure";
import {
  WriterAllocateExpression,
  WriterExpression,
  WriterGlobalReferenceExpression,
  WriterInvokationExpression,
  WriterReferenceExpression,
} from "../../writer/expression";
import { WriterFile } from "../../writer/file";
import { WriterFunction } from "../../writer/entity";
import { WriterType } from "../../writer/type";
import {
  WriterReturnStatement,
  WriterStatement,
  WriterVariableStatement,
} from "../../writer/statement";

export class MakeExpression extends Expression implements IInstance, IClosure {
  readonly #struct: Type;
  readonly #using: Block;

  readonly [InstanceId] = true;

  constructor(ctx: CodeLocation, struct: Type, using: Block) {
    super(ctx);
    this.#struct = struct;
    this.#using = using;
  }

  get Reference(): string {
    return this.CName;
  }

  Resolve(name: string, ctx: ClosureContext): Array<IInstance> {
    if (name === "__make_target__") return [this];
    return [];
  }

  ResolveType(name: string, ctx: ClosureContext): Array<IConcreteType> {
    return [];
  }

  DiscoverType(name: string, ctx: ClosureContext): IDiscoverableType[] {
    return [];
  }

  Build(
    file: WriterFile,
    func: WriterFunction,
    scope: Scope
  ): [WriterFile, WriterFunction, WriterExpression] {
    let type: WriterType;
    [file, type] = this.ResolvesTo(scope).Build(file, scope);

    let main_func = new WriterFunction(
      this.CName,
      [],
      type,
      [],
      func
    ).WithStatement(
      new WriterVariableStatement(
        this.CName,
        type,
        new WriterAllocateExpression(type)
      )
    );
    let main_statements: Array<WriterStatement>;
    [file, main_func, main_statements] = this.#using.Build(
      file,
      main_func,
      scope.With(this)
    );

    main_statements = [
      ...main_statements,
      new WriterReturnStatement(new WriterReferenceExpression(this)),
    ];
    main_func = main_func.WithStatements(main_statements);
    file = file.WithEntity(main_func);

    return [
      file,
      func,
      new WriterInvokationExpression(
        new WriterGlobalReferenceExpression(main_func),
        []
      ),
    ];
  }

  ResolvesTo(scope: Scope): Type {
    return this.#struct;
  }
}

Expression.Register({
  Priority: 3,
  Is(token_group, prefix) {
    return token_group.Text === "make";
  },
  Extract(token_group, prefix) {
    const [after_type, type] = Type.Parse(token_group.Next);

    const [after_using, using] = Block.Parse(after_type);

    return [
      after_using,
      new MakeExpression(token_group.CodeLocation, type, using),
    ];
  },
});
