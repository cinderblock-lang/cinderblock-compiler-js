import { IInstance, Scope } from "../../linker/closure";
import { CodeLocation } from "../../location/code-location";
import { WriterFunction } from "../../writer/entity";
import { WriterExpression } from "../../writer/expression";
import { WriterFile } from "../../writer/file";
import {
  WriterEmptyStatement,
  WriterStatement,
  WriterVariableStatement,
} from "../../writer/statement";
import { WriterType } from "../../writer/type";
import { Expression } from "../expression/base";
import { Statement } from "./base";

export class SubStatement extends Statement implements IInstance {
  readonly #name: string;
  readonly #equals: Expression;

  #inserted = false;

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

  Build(
    file: WriterFile,
    func: WriterFunction,
    scope: Scope
  ): [WriterFile, WriterFunction, WriterStatement] {
    if (this.#inserted) return [file, func, new WriterEmptyStatement()];

    this.#inserted = true;
    let assignment: WriterExpression;
    [file, func, assignment] = this.#equals.Build(file, func, scope);
    let type: WriterType;
    [file, type] = this.#equals.ResolvesTo(scope).Build(file, scope);

    return [
      file,
      func,
      new WriterVariableStatement(this.CName, type, assignment),
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
