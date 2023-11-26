import { Expression } from "./base";
import { ReferenceExpression } from "./reference";
import { AccessExpression } from "./access";
import { Component } from "../component";
import { ComponentGroup } from "../component-group";
import { WriterContext } from "../writer";
import { CodeLocation } from "../../location/code-location";
import { FindReference, ResolveExpressionType } from "../../linker/resolve";
import { LinkerError } from "../../linker/error";
import { IsAnyStructLike, IsAnyInvokable } from "../../linker/types";
import { Namer } from "../../location/namer";

export class InvokationExpression extends Expression {
  readonly #subject: Component;
  readonly #parameters: ComponentGroup;

  constructor(
    ctx: CodeLocation,
    subject: Expression,
    parameters: ComponentGroup
  ) {
    super(ctx);
    this.#subject = subject;
    this.#parameters = parameters;
  }

  get Subject() {
    return this.#subject;
  }

  get Parameters() {
    return this.#parameters;
  }

  get type_name() {
    return "invokation_expression";
  }

  BuildInvokation(ctx: WriterContext) {
    if (this.Subject instanceof AccessExpression) {
      const target = ResolveExpressionType(this.Subject.Subject, ctx);
      if (IsAnyStructLike(target) && target.HasKey(this.Subject.Target))
        return this;

      const func = FindReference(this.Subject.Target, ctx);
      if (!IsAnyInvokable(func))
        throw new LinkerError(
          this.Subject.CodeLocation,
          "Could not find subject"
        );

      const params = new ComponentGroup(
        this.Subject.Subject,
        ...this.Parameters.iterator()
      );
      return new InvokationExpression(
        this.CodeLocation,
        new ReferenceExpression(this.Subject.CodeLocation, func.Name),
        params
      );
    }

    return this;
  }

  c(ctx: WriterContext): string {
    const invokation = this.BuildInvokation(ctx);
    const reference = invokation.Subject.c({
      ...ctx,
      invokation: invokation,
    });

    const returns = ResolveExpressionType(this, ctx);

    const name = Namer.GetName();
    ctx.prefix.push(
      `${returns.c(ctx)} (*${name})(${[
        "void*",
        ...invokation.Parameters.map((p) => {
          const type = ResolveExpressionType(p, ctx);
          return type.c(ctx);
        }),
      ].join(", ")}) = ${reference}.handle;`
    );

    return `(*${name})(${[
      `${reference}.data`,
      ...invokation.Parameters.map((p) => p.c(ctx)),
    ].join(", ")})`;
  }
}
