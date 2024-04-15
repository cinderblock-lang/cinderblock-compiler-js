import { Expression } from "./base";
import { CodeLocation } from "../../location/code-location";
import { Type } from "../type/base";
import { Closure } from "../closure";
import { Scope } from "../../linker/closure";
import { WriterExpression } from "../../writer/expression";
import { WriterFile } from "../../writer/file";
import { WriterFunction } from "../../writer/entity";

export class PickExpression extends Expression {
  readonly #enum: Type;
  readonly #key: string;
  readonly #using: Closure;

  constructor(ctx: CodeLocation, target: Type, key: string, using: Closure) {
    super(ctx);
    this.#enum = target;
    this.#key = key;
    this.#using = using;
  }

  Build(
    file: WriterFile,
    func: WriterFunction,
    scope: Scope
  ): [WriterFile, WriterFunction, WriterExpression] {
    throw new Error("Method not implemented.");
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
