import { Expression } from "./base";
import { CodeLocation } from "../../location/code-location";
import { ParserError } from "../../parser/error";
import { Scope } from "../../linker/closure";
import { WriterExpression } from "../../writer/expression";
import { WriterFile } from "../../writer/file";
import { Type } from "../type/base";
import { FunctionType } from "../type/function";
import { LinkerError } from "../../linker/error";
import { WriterFunction } from "../../writer/entity";

export class InvokationExpression extends Expression {
  readonly #subject: Expression;
  readonly #parameters: Array<Expression>;

  constructor(
    ctx: CodeLocation,
    subject: Expression,
    parameters: Array<Expression>
  ) {
    super(ctx);
    this.#subject = subject;
    this.#parameters = parameters;
  }

  Build(
    file: WriterFile,
    func: WriterFunction,
    scope: Scope
  ): [WriterFile, WriterFunction, WriterExpression] {
    throw new Error("Method not implemented.");
  }

  ResolvesTo(scope: Scope): Type {
    const parameters = this.#parameters.map((p) =>
      p.ResolvesTo(scope).ResolveConcrete(scope)
    );

    const func = this.#subject.ResolvesTo(
      scope.WithParametersForNextClosure(parameters)
    );
    if (!(func instanceof FunctionType))
      throw new LinkerError(
        this.CodeLocation,
        "error",
        "May only invoke functions"
      );

    return func.Returns;
  }
}

Expression.Register({
  Priority: 2,
  Is(token_group, prefix) {
    return token_group.Text === "(" && !!prefix;
  },
  Extract(token_group, prefix) {
    const start = token_group.CodeLocation;
    if (!prefix)
      throw new ParserError(
        token_group.CodeLocation,
        "Attempting an invokation without a referenced function"
      );

    let parameters: Array<Expression> = [];
    while (token_group.Text !== ")") {
      token_group = token_group.Next;
      let result: Expression;
      [token_group, result] = Expression.Parse(token_group, [",", ")"]);
      parameters = [...parameters, result];
      token_group = token_group.Previous;
    }

    token_group = token_group.Next;

    return [token_group, new InvokationExpression(start, prefix, parameters)];
  },
});
