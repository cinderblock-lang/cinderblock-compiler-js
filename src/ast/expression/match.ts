import { Expression } from "./base";
import { CodeLocation } from "../../location/code-location";
import { Block } from "../block";
import {
  ClosureContext,
  IClosure,
  IConcreteType,
  IDiscoverableType,
  IInstance,
  Scope,
} from "../../linker/closure";
import {
  WriterAccessExpression,
  WriterExpression,
  WriterGlobalReferenceExpression,
  WriterInvokationExpression,
  WriterLiteralExpression,
  WriterOperatorExpression,
  WriterReferenceExpression,
  WriterTernayExpression,
} from "../../writer/expression";
import { WriterFile } from "../../writer/file";
import { Type } from "../type/base";
import { SubStatement } from "../statement/sub";
import { LinkerError } from "../../linker/error";
import { WriterFunction, WriterProperty } from "../../writer/entity";
import { EnumEntity } from "../entity/enum";
import { WriterStatement } from "../../writer/statement";
import { WriterType } from "../../writer/type";

export class MatchExpression extends Expression implements IClosure {
  readonly #subject: SubStatement;
  readonly #using: Record<string, Block>;

  constructor(
    ctx: CodeLocation,
    subject: Expression,
    as: string,
    using: Record<string, Block>
  ) {
    super(ctx);
    this.#subject = new SubStatement(this.CodeLocation, as, subject);
    this.#using = using;
  }

  DiscoverType(name: string, ctx: ClosureContext): IDiscoverableType[] {
    return [];
  }

  Resolve(name: string, ctx: ClosureContext): Array<IInstance> {
    if (name === this.#subject.Name) return [this.#subject];
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

    const subject_type_instance = this.#subject.Type(scope);
    let subject_type: WriterType;
    [file, subject_type] = subject_type_instance.Build(file, scope);
    const subject_enum = subject_type_instance.ResolveConcrete(scope);
    if (!(subject_enum instanceof EnumEntity))
      throw new LinkerError(
        this.CodeLocation,
        "error",
        "May only match on an enum"
      );

    let subject: WriterStatement;
    [file, func, subject] = this.#subject.Build(file, func, scope);

    const first = subject_enum.GetKey(subject_enum.Keys[0]);
    if (!first)
      throw new LinkerError(
        this.CodeLocation,
        "error",
        "Could not resolve key"
      );

    let first_func = new WriterFunction(
      first.CName,
      [new WriterProperty(this.#subject.CName, subject_type)],
      type,
      [],
      func
    );
    let first_statements: Array<WriterStatement>;
    [file, first_func, first_statements] = this.#using[first.Name].Build(
      file,
      first_func,
      scope.With(this)
    );
    file = file.WithEntity(first_func.WithStatements(first_statements));

    return subject_enum.Keys.slice(1)
      .map((k) => subject_enum.GetKey(k))
      .reduce(
        ([ci, cf, e], n) => {
          if (!n)
            throw new LinkerError(
              this.CodeLocation,
              "error",
              "Could not resolve key"
            );

          let n_func = new WriterFunction(
            n.CName,
            [new WriterProperty(this.#subject.CName, subject_type)],
            type,
            [],
            func
          );
          let n_statements: Array<WriterStatement>;
          [ci, n_func, n_statements] = this.#using[n.Name].Build(
            file,
            n_func,
            scope.With(this)
          );
          ci = ci.WithEntity(n_func.WithStatements(n_statements));

          return [
            ci,
            cf,
            new WriterTernayExpression(
              new WriterOperatorExpression(
                new WriterAccessExpression(
                  new WriterReferenceExpression(this.#subject),
                  n.CName
                ),
                new WriterLiteralExpression("NULL"),
                "!="
              ),
              new WriterInvokationExpression(
                new WriterGlobalReferenceExpression(n_func),
                [
                  new WriterAccessExpression(
                    new WriterReferenceExpression(this.#subject),
                    n.CName
                  ),
                ]
              ),
              e
            ),
          ];
        },
        [
          file,
          func,
          new WriterInvokationExpression(
            new WriterGlobalReferenceExpression(first_func),
            [
              new WriterAccessExpression(
                new WriterReferenceExpression(this.#subject),
                first.CName
              ),
            ]
          ),
        ] as [WriterFile, WriterFunction, WriterExpression]
      );
  }

  ResolvesTo(scope: Scope): Type {
    const result = Object.keys(this.#using)
      .map((k) => this.#using[k].ResolvesTo(scope.With(this)))
      .find((c) => !!c);

    if (!result)
      throw new LinkerError(
        this.CodeLocation,
        "error",
        "Could not resolve match expression"
      );

    return result;
  }
}

Expression.Register({
  Priority: 3,
  Is(token_group, prefix) {
    return token_group.Text === "match";
  },
  Extract(token_group, prefix) {
    token_group.Next.Expect("(");
    const [after_subject, subject] = Expression.Parse(token_group.Skip(2), [
      "as",
    ]);

    const as = after_subject.Next.Text;

    let after_using = after_subject.Skip(2);
    after_using.Expect("{");

    const using: Record<string, Block> = {};
    while (after_using.Text !== "}") {
      const name = after_using.Next.Text;
      after_using.Skip(2).Expect(":");
      const [after_block, block] = Block.Parse(after_subject.Skip(3));

      using[name] = block;
      after_using = after_block;
    }

    return [
      after_using,
      new MatchExpression(token_group.CodeLocation, subject, as, using),
    ];
  },
});
