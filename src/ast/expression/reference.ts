import { Expression } from "./base";
import { CodeLocation } from "../../location/code-location";
import { Scope } from "../../linker/closure";
import { WriterExpression } from "../../writer/expression";
import { WriterFile } from "../../writer/file";
import { Type } from "../type/base";
import { SubStatement } from "../statement/sub";
import { FunctionEntity } from "../entity/function";
import { LinkerError } from "../../linker/error";
import { WriterFunction } from "../../writer/entity";

export class ReferenceExpression extends Expression {
  readonly #name: string;

  constructor(ctx: CodeLocation, name: string) {
    super(ctx);
    this.#name = name;
  }

  get Name() {
    return this.#name;
  }

  Build(
    file: WriterFile,
    func: WriterFunction,
    scope: Scope
  ): [WriterFile, WriterFunction, WriterExpression] {
    throw new Error("Method not implemented.");
  }

  ResolvesTo(scope: Scope): Type {
    const references = scope.Resolve(this.#name);

    if (references instanceof SubStatement) {
      return references.Type(scope);
    }

    if (references instanceof FunctionEntity) {
      return references.ResolvesTo(scope);
    }

    throw new LinkerError(
      this.CodeLocation,
      "error",
      "Could not resolve reference"
    );
  }
}

Expression.Register({
  Priority: 0,
  Is(token_group, prefix) {
    return true;
  },
  Extract(token_group, prefix, look_for) {
    return [
      token_group.Next,
      new ReferenceExpression(token_group.CodeLocation, token_group.Text),
    ];
  },
});
