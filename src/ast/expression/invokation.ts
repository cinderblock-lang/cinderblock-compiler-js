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
import { RequireType } from "../../location/require-type";
import { FunctionParameter } from "../function-parameter";
import { ReturnStatement } from "../statement/return";
import { StructEntity } from "../entity/struct";
import { FunctionEntity } from "../entity/function";
import { Property } from "../property";
import { RawStatement } from "../statement/raw";

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

      const func = ctx.FindReference(this.Subject.Target)[0];
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

  #partial_parameters(func: FunctionType) {
    const p = [...func.Parameters.iterator()];

    return p.slice(1, p.length - this.Parameters.Length);
  }

  #build_partial(
    ctx: WriterContext,
    func: FunctionType,
    invokation: InvokationExpression
  ) {
    const name = Namer.GetName();
    const existing = [...invokation.Parameters.iterator()];

    const func_parameters: Array<Component> =
      invokation.#partial_parameters(func);

    const ctx_struct = new StructEntity(
      this.CodeLocation,
      true,
      name + "_struct",
      new ComponentGroup(
        ...existing.map(
          (e, i) =>
            new Property(
              this.CodeLocation,
              "a" + i.toString(),
              e.resolve_type(ctx),
              false
            )
        )
      ),
      ctx.Namespace,
      ctx.Using
    );

    const result = new FunctionEntity(
      this.CodeLocation,
      true,
      name,
      ctx.AllowUnsafe,
      new ComponentGroup(...func_parameters),
      new ComponentGroup(
        new RawStatement(
          this.CodeLocation,
          `${ctx_struct.c(ctx)} _ctx = *(${ctx_struct.c(ctx)}*)ctx;`,
          "_ctx",
          ctx_struct
        ),
        new ReturnStatement(
          this.CodeLocation,
          new InvokationExpression(
            this.CodeLocation,
            invokation.Subject,
            new ComponentGroup(
              ...func_parameters.map((p) => {
                RequireType(FunctionParameter, p);
                return new ReferenceExpression(this.CodeLocation, p.Name);
              }),
              ...existing.map(
                (_, i) =>
                  new AccessExpression(
                    this.CodeLocation,
                    new ReferenceExpression(this.CodeLocation, "_ctx"),
                    "a" + i.toString()
                  )
              )
            )
          )
        )
      ),
      func.Returns,
      ctx.Namespace,
      ctx.Using
    );

    ctx.AddGlobalFunction(result.Name, result);

    const instance = result.c(ctx);
    const ctx_ref = ctx_struct.c(ctx);
    const data_name = Namer.GetName();
    ctx.AddPrefix(`${instance}.data = malloc(sizeof(${ctx_ref}));`, name, [
      instance,
    ]);
    ctx.AddPrefix(
      `${ctx_ref}* ${data_name} = (${ctx_ref}*)${instance}.data;`,
      data_name,
      [instance]
    );

    for (let i = 0; i < existing.length; i++) {
      const k = "a" + i.toString();
      const t = existing[i];
      const val = t instanceof FunctionParameter ? t.Reference : t.c(ctx);
      ctx.AddPrefix(`${data_name}->${k} = ${val};`, `${data_name}->${k}`, [
        data_name,
        val,
      ]);
    }

    return instance;
  }

  c(ctx: WriterContext): string {
    const invokation = this.#build_invokation(ctx);
    const with_invokation = ctx.WithInvokation(invokation);
    let subject: Component | undefined = undefined;
    if (invokation.Subject instanceof ReferenceExpression) {
      const possible = ctx.FindReference(invokation.Subject.Name);
      for (const item of possible) {
        if (item.compatible(invokation, with_invokation)) {
          subject = item;
          break;
        }
      }

      if (!subject)
        throw new LinkerError(this.CodeLocation, "Could not resolve function");
    } else {
      subject = invokation.Subject;
    }

    const reference =
      subject instanceof FunctionParameter
        ? subject.Reference
        : subject.c(with_invokation);

    const func = subject.resolve_type(ctx.WithInvokation(invokation));
    if (!(func instanceof FunctionType))
      throw new LinkerError(this.CodeLocation, "May only invoke functions");

    if (
      func.Parameters.filter((p) => {
        RequireType(FunctionParameter, p);
        return !p.Optional;
      }).length -
        1 >
      invokation.Parameters.Length
    ) {
      return this.#build_partial(ctx, func, invokation);
    }

    const returns = func.Returns;

    const render_params = [
      "void*",
      ...func.Parameters.filter((p) => {
        RequireType(FunctionParameter, p);
        return p.Name !== "ctx";
      }).map((p) => {
        const type = p.resolve_type(ctx);
        return type.c(ctx);
      }),
    ];

    const render_input = [
      `${reference}.data`,
      ...invokation.Parameters.map((p) => p.c(ctx)),
    ];

    const padding = render_params.length - render_input.length;

    const name = Namer.GetName();
    ctx.AddPrefix(
      `${returns.c(ctx)} (*${name})(${render_params.join(
        ", "
      )}) = ${reference}.handle;`,
      name,
      [reference]
    );

    return `(*${name})(${[
      ...render_input,
      ...Array.apply(null, Array(Math.max(padding, 0))).map((_, i) => {
        const p = func.Parameters.map((p) => p)[i];
        RequireType(FunctionParameter, p);
        return p.Type?.default(ctx) ?? "";
      }),
    ].join(", ")})`;
  }

  compatible(target: Component, ctx: WriterContext): boolean {
    return this.resolve_type(ctx).compatible(target, ctx);
  }

  resolve_type(ctx: WriterContext): Component {
    const invokation = this.#build_invokation(ctx);
    const func = invokation.Subject.resolve_type(
      ctx.WithInvokation(invokation)
    );
    if (!(func instanceof FunctionType))
      throw new LinkerError(this.CodeLocation, "May only invoke functions");

    if (
      func.Parameters.filter((p) => {
        RequireType(FunctionParameter, p);
        return !p.Optional;
      }).length -
        1 >
      invokation.Parameters.Length
    ) {
      return new FunctionType(
        this.CodeLocation,
        new ComponentGroup(...invokation.#partial_parameters(func)),
        func.Returns
      );
    }

    return func.Returns.resolve_type(ctx);
  }

  default(ctx: WriterContext): string {
    throw new LinkerError(this.CodeLocation, "May not have a default");
  }
}
