import { IInstance, Scope } from "../../linker/closure";
import { CodeLocation } from "../../location/code-location";
import { WriterExpression } from "../../writer/expression";
import { WriterFile } from "../../writer/file";
import {
  WriterStatement,
  WriterVariableStatement,
} from "../../writer/statement";
import { Expression } from "../expression/base";
import { Statement } from "./base";

export class SubStatement extends Statement implements IInstance {
  readonly #name: string;
  readonly #equals: Expression;

  constructor(ctx: CodeLocation, name: string, equals: Expression) {
    super(ctx);
    this.#name = name;
    this.#equals = equals;
  }

  get Reference(): string {
    return this.CName;
  }

  get Name() {
    return this.#name;
  }

  Build(file: WriterFile, scope: Scope): [WriterFile, WriterStatement] {
    let assignment: WriterExpression;
    [file, assignment] = this.#equals.Build(file, scope);

    return [
      file,
      new WriterVariableStatement(
        this.CName,
        this.#equals.ResolvesTo(scope).Build(scope),
        assignment
      ),
    ];
  }

  Type(scope: Scope) {
    return this.#equals.ResolvesTo(scope);
  }
}

Statement.Register({
  Is(token_group) {
    return token_group.Next.Text === "->";
  },
  Extract(token_group) {
    const name = token_group.Text;
    const [after_expression, expression] = Expression.Parse(
      token_group.Skip(2)
    );

    return [
      after_expression,
      new SubStatement(token_group.CodeLocation, name, expression),
    ];
  },
});
