import { Expression } from "./base";
import { CodeLocation } from "../../location/code-location";
import { Closure } from "../closure";
import {
  ClosureContext,
  IClosure,
  IConcreteType,
  IInstance,
  Scope,
} from "../../linker/closure";
import { WriterExpression } from "../../writer/expression";
import { WriterFile } from "../../writer/file";
import { Type } from "../type/base";
import { SubStatement } from "../statement/sub";
import { LinkerError } from "../../linker/error";

export class MatchExpression extends Expression implements IClosure {
  readonly #subject: SubStatement;
  readonly #using: Record<string, Closure>;

  constructor(
    ctx: CodeLocation,
    subject: Expression,
    as: string,
    using: Record<string, Closure>
  ) {
    super(ctx);
    this.#subject = new SubStatement(this.CodeLocation, as, subject);
    this.#using = using;
  }

  Resolve(name: string, ctx: ClosureContext): IInstance | undefined {
    if (name === this.#subject.Name) return this.#subject;
  }

  ResolveType(name: string, ctx: ClosureContext): IConcreteType | undefined {
    return undefined;
  }

  Build(file: WriterFile, scope: Scope): [WriterFile, WriterExpression] {
    throw new Error("Method not implemented.");
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

    const using: Record<string, Closure> = {};
    while (after_using.Text !== "}") {
      const name = after_using.Next.Text;
      after_using.Skip(2).Expect(":");
      const [after_block, block] = Closure.Parse(after_subject.Skip(3));

      using[name] = block;
      after_using = after_block;
    }

    return [
      after_using,
      new MatchExpression(token_group.CodeLocation, subject, as, using),
    ];
  },
});
