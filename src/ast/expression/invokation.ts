import { Expression } from "./base";
import { ReferenceExpression } from "./reference";
import { AccessExpression } from "./access";
import { Component } from "../component";
import { ComponentGroup } from "../component-group";
import { WriterContext } from "../writer";
import { CodeLocation } from "../../location/code-location";
import { LinkerError } from "../../linker/error";
import { IsAnyStructLike, IsAnyInvokable } from "../../linker/types";
import { Namer } from "../../location/namer";
import { FunctionType } from "../type/function";
import { IterableType } from "../type/iterable";

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

  #build_invokation(ctx: WriterContext) {
    if (this.Subject instanceof AccessExpression) {
      const target = this.Subject.Subject.resolve_type(ctx);
      if (
        (IsAnyStructLike(target) && target.HasKey(this.Subject.Target)) ||
        (target instanceof IterableType && this.Subject.Target === "next")
      )
        return this;

      const func = ctx.FindReference(this.Subject.Target);
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
    const invokation = this.#build_invokation(ctx);
    const reference = invokation.Subject.c(ctx.WithInvokation(invokation));
    const func = invokation.Subject.resolve_type(
      ctx.WithInvokation(invokation)
    );
    if (!(func instanceof FunctionType))
      throw new LinkerError(this.CodeLocation, "May only invoke functions");

    const returns = func.Returns;

    const name = Namer.GetName();
    ctx.AddPrefix(
      `${returns.c(ctx)} (*${name})(${[
        "void*",
        ...func.Parameters.map((p) => {
          const type = p.resolve_type(ctx);
          return type.c(ctx);
        }),
      ].join(", ")}) = ${reference}.handle;`
    );

    return `(*${name})(${[
      `${reference}.data`,
      ...invokation.Parameters.map((p) => p.c(ctx)),
    ].join(", ")})`;
  }

  resolve_type(ctx: WriterContext): Component {
    const invokation = this.#build_invokation(ctx);
    const func = invokation.Subject.resolve_type(
      ctx.WithInvokation(invokation)
    );
    if (!(func instanceof FunctionType))
      throw new LinkerError(this.CodeLocation, "May only invoke functions");

    return func.Returns;
  }
}
