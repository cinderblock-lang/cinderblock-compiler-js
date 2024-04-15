import { Expression } from "./base";
import { CodeLocation } from "../../location/code-location";
import { Type } from "../type/base";
import { Closure } from "../closure";
import { Scope } from "../../linker/closure";
import { WriterExpression } from "../../writer/expression";
import { WriterFile } from "../../writer/file";

export class MakeExpression extends Expression {
  readonly #struct: Type;
  readonly #using: Closure;

  constructor(ctx: CodeLocation, struct: Type, using: Closure) {
    super(ctx);
    this.#struct = struct;
    this.#using = using;
  }

  Build(file: WriterFile, scope: Scope): [WriterFile, WriterExpression] {
    throw new Error("Method not implemented.");
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
