import { Scope } from "../../linker/closure";
import { LinkerError } from "../../linker/error";
import { CodeLocation } from "../../location/code-location";
import { WriterFunction } from "../../writer/entity";
import { WriterExpression } from "../../writer/expression";
import { WriterFile } from "../../writer/file";
import { WriterAssignStatement, WriterStatement } from "../../writer/statement";
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

  Build(
    file: WriterFile,
    func: WriterFunction,
    scope: Scope
  ): [WriterFile, WriterFunction, WriterStatement] {
    const [make] = scope.Resolve("__make_target__");
    if (!make)
      throw new LinkerError(
        this.CodeLocation,
        "error",
        "Attempting an assign outside of a make expression"
      );
    let value: WriterExpression;
    [file, func, value] = this.#equals.Build(file, func, scope);
    return [
      file,
      func,
      new WriterAssignStatement(make.CName, this.#name, value),
    ];
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
