import { LinkedAccessExpression } from "../../linked-ast/expression/access";
import { LinkedStructType } from "../../linked-ast/type/struct";
import { LinkerError } from "../../linker/error";
import { CodeLocation } from "../../location/code-location";
import { ParserError } from "../../parser/error";
import { Context } from "../context";
import { Expression } from "./base";
import { ReferenceExpression } from "./reference";

export class AccessExpression extends Expression {
  readonly #subject: Expression;
  readonly #target: string;

  constructor(ctx: CodeLocation, subject: Expression, target: string) {
    super(ctx);
    this.#subject = subject;
    this.#target = target;
  }

  get Subject() {
    return this.#subject;
  }

  get Target() {
    return this.#target;
  }

  MayAccess(context: Context) {
    const subject = this.#subject.Linked(context);

    if (!(subject instanceof LinkedStructType)) return false;

    const property = subject.GetKey(this.#target);
    if (!property) return false;

    return true;
  }

  LinkedFunctionTarget(context: Context) {
    return new ReferenceExpression(this.CodeLocation, this.#target).Linked(
      context
    );
  }

  Linked(context: Context) {
    return context.Build(
      {
        subject: (c) => this.#subject.Linked(c),
      },
      ({ subject }) => {
        const subject_type = subject.Type;

        if (!(subject_type instanceof LinkedStructType))
          throw new LinkerError(
            this.CodeLocation,
            "error",
            "May only access a struct"
          );

        const property = subject_type.GetKey(this.#target);
        if (!property)
          throw new LinkerError(
            this.CodeLocation,
            "error",
            "Cannot find key of struct"
          );

        return new LinkedAccessExpression(this.CodeLocation, subject, property);
      }
    );
  }
}

Expression.Register({
  Priority: 2,
  Is(token_group) {
    return token_group.Text === ".";
  },
  Extract(token_group, prefix) {
    if (!prefix)
      throw new ParserError(
        token_group.CodeLocation,
        "Attempting an access without a left hand side"
      );

    const accessed = token_group.Next;

    return [
      accessed.Next,
      new AccessExpression(accessed.CodeLocation, prefix, accessed.Text),
    ];
  },
});
