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
  WriterGlobalReferenceExpression,
  WriterInvokationExpression,
  WriterReferenceExpression,
} from "../../writer/expression";
import { WriterFile } from "../../writer/file";
import { WriterFunction } from "../../writer/entity";
import { WriterType } from "../../writer/type";
import {
  WriterAssignStatement,
  WriterStatement,
  WriterVariableStatement,
} from "../../writer/statement";
import { EnumEntity } from "../entity/enum";
import { LinkerError } from "../../linker/error";

export class PickExpression extends Expression implements IClosure, IInstance {
  readonly #enum: Type;
  readonly #key: string;
  readonly #using: Closure;

  constructor(ctx: CodeLocation, target: Type, key: string, using: Closure) {
    super(ctx);
    this.#enum = target;
    this.#key = key;
    this.#using = using;
  }

  get Reference(): string {
    return this.CName;
  }

  Resolve(name: string, ctx: ClosureContext): Array<IInstance> {
    if (name === "__pick_target__") return [this];
    return [];
  }

  ResolveType(name: string, ctx: ClosureContext): Array<IConcreteType> {
    return [];
  }

  Build(
    file: WriterFile,
    func: WriterFunction,
    scope: Scope
  ): [WriterFile, WriterFunction, WriterExpression] {
    let type: WriterType;
    [file, type] = this.ResolvesTo(scope).Build(file, scope);

    let main_func = new WriterFunction(this.CName, [], type, [], func);
    let main_statements: Array<WriterStatement>;
    [file, main_func, main_statements] = this.#using.Build(
      file,
      main_func,
      scope.With(this)
    );
    file = file.WithEntity(main_func.WithStatements(main_statements));

    const enum_type = this.ResolvesTo(scope).ResolveConcrete(scope);
    if (!(enum_type instanceof EnumEntity))
      throw new LinkerError(
        this.CodeLocation,
        "error",
        "May only pick from enums"
      );
    const property = enum_type.GetKey(this.#key);
    if (!property)
      throw new LinkerError(this.CodeLocation, "error", "Could not find key");

    return [
      file,
      func
        .WithStatement(
          new WriterVariableStatement(
            this.CName,
            type,
            new WriterAllocateExpression(type)
          )
        )
        .WithStatement(
          new WriterAssignStatement(
            this.CName,
            property.CName,
            new WriterInvokationExpression(
              new WriterGlobalReferenceExpression(main_func),
              []
            )
          )
        ),
      new WriterReferenceExpression(this),
    ];
  }

  ResolvesTo(scope: Scope): Type {
    return this.#enum;
  }
}

Expression.Register({
  Priority: 3,
  Is(token_group, prefix) {
    return token_group.Text === "pick";
  },
  Extract(token_group, prefix, look_for) {
    const [after_target, target] = Type.Parse(token_group);

    after_target.Expect(".");

    const key = after_target.Next.Text;

    const [after_block, block] = Closure.Parse(after_target.Skip(2));

    return [
      after_block,
      new PickExpression(token_group.CodeLocation, target, key, block),
    ];
  },
});
