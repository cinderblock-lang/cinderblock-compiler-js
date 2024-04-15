import { Scope } from "../../linker/closure";
import { CodeLocation } from "../../location/code-location";
import { WriterExpression } from "../../writer/expression";
import { WriterFile } from "../../writer/file";
import { WriterStatement, WriterAssignStatement } from "../../writer/statement";
import { Expression } from "../expression/base";
import { Statement } from "./base";

export class AssignStatement extends Statement {
  readonly #name: string;
  readonly #equals: Expression;

  constructor(ctx: CodeLocation, name: string, equals: Expression) {
    super(ctx);
    this.#name = name;
    this.#equals = equals;
  }

  Build(file: WriterFile, scope: Scope): [WriterFile, WriterStatement] {
    let value: WriterExpression;
    [file, value] = this.#equals.Build(file, scope);
    return [file, new WriterAssignStatement("made", this.#name, value)];
  }
}

Statement.Register({
  Is(token_group) {
    return token_group.Text === "assign";
  },
  Extract(token_group) {
    const name = token_group.Next.Text;
    token_group.Skip(2).Expect("=");

    const [after_expression, expression] = Expression.Parse(
      token_group.Skip(3)
    );

    return [
      after_expression,
      new AssignStatement(token_group.CodeLocation, name, expression),
    ];
  },
});
