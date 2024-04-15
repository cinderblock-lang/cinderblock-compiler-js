import { Expression } from "./base";
import { CodeLocation } from "../../location/code-location";
import { Type } from "../type/base";
import { Closure } from "../closure";
import {
  ClosureContext,
  IClosure,
  IConcreteType,
  IInstance,
  Scope,
} from "../../linker/closure";
import {
  WriterAllocateExpression,
  WriterExpression,
  WriterInvokationExpression,
} from "../../writer/expression";
import { WriterFile } from "../../writer/file";
import { WriterFunction } from "../../writer/entity";
import { WriterType } from "../../writer/type";
import {
  WriterStatement,
  WriterVariableStatement,
} from "../../writer/statement";

export class MakeExpression extends Expression implements IInstance, IClosure {
  readonly #struct: Type;
  readonly #using: Closure;

  constructor(ctx: CodeLocation, struct: Type, using: Closure) {
    super(ctx);
    this.#struct = struct;
    this.#using = using;
  }

  get Reference(): string {
    return this.CName;
  }

  Resolve(name: string, ctx: ClosureContext): IInstance | undefined {
    if (name === "__make_target__") return this;
  }

  ResolveType(name: string, ctx: ClosureContext): IConcreteType | undefined {
    return undefined;
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
    file = file.WithEntity(main_func.WithStatements(main_statements));

    return [file, func, new WriterInvokationExpression(main_func, [])];
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

    const [after_using, using] = Closure.Parse(after_type);

    return [
      after_using,
      new MakeExpression(token_group.CodeLocation, type, using),
    ];
  },
});
