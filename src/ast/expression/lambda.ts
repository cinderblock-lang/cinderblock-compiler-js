import { Expression } from "./base";
import { Property } from "../property";
import { ReferenceExpression } from "./reference";
import { AccessExpression } from "./access";
import { ComponentGroup } from "../component-group";
import { WriterContext } from "../writer";
import { FunctionParameter } from "../function-parameter";
import { Type } from "../type/base";
import { StructEntity } from "../entity/struct";
import { FunctionEntity } from "../entity/function";
import { RawStatement } from "../statement/raw";
import { SubStatement } from "../statement/sub";
import { CodeLocation } from "../../location/code-location";
import { LinkerError } from "../../linker/error";
import { Namer } from "../../location/namer";
import { RequireType } from "../../location/require-type";
import { Component } from "../component";
import { FunctionType } from "../type/function";

export class LambdaExpression extends Expression {
  readonly #parameters: ComponentGroup;
  readonly #body: ComponentGroup;
  readonly #returns: Component | undefined;

  readonly #name: string;

  constructor(
    ctx: CodeLocation,
    parameters: ComponentGroup,
    body: ComponentGroup,
    returns: Component | undefined
  ) {
    super(ctx);
    this.#parameters = parameters;
    this.#body = body;
    this.#returns = returns;

    this.#name = Namer.GetName();
  }

  get Parameters() {
    return this.#parameters;
  }

  get Body() {
    return this.#body;
  }

  get Returns() {
    return this.#returns;
  }

  get type_name() {
    return "lambda_expression";
  }

  invoked(ctx: WriterContext) {
    const expected = [...this.Parameters.iterator()];
    const actual = [...(ctx.Invokation?.Parameters.iterator() ?? [])];
    const input: Array<FunctionParameter> = [];

    for (let i = 0; i < expected.length; i++) {
      const e = expected[i];
      RequireType(FunctionParameter, e);
      const a = actual[i];

      if (!a) {
        input.push(e);
        continue;
      }

      input.push(
        new FunctionParameter(
          e.CodeLocation,
          e.Name,
          a.resolve_type(ctx),
          e.Optional
        )
      );
    }

    return new LambdaExpression(
      this.CodeLocation,
      new ComponentGroup(...input),
      this.Body,
      this.Returns
    );
  }

  c(ctx: WriterContext): string {
    const name = ctx.Callstack.join("__") + this.#name;

    const all = [...ctx.Locals, ...ctx.Parameters].filter(([k]) => k !== "ctx");

    const expected = [...this.Parameters.iterator()];
    const actual = [...(ctx.Invokation?.Parameters.iterator() ?? [])];
    const func_parameters: Array<FunctionParameter> = [];

    for (let i = 0; i < expected.length; i++) {
      const e = expected[i];
      RequireType(FunctionParameter, e);
      const a = actual[i];
      if (!a) {
        if (!e.Type)
          throw new LinkerError(e.CodeLocation, "Canot determine type");
        ctx = ctx.WithFunctionParameter(e.Name, e);
        func_parameters.push(e);
        continue;
      }

      const param = new FunctionParameter(
        this.CodeLocation,
        e.Name,
        a.resolve_type(ctx),
        false
      );
      ctx = ctx.WithFunctionParameter(e.Name, param);
      func_parameters.push(param);
    }

    const ctx_struct = new StructEntity(
      this.CodeLocation,
      true,
      name + "_struct",
      new ComponentGroup(
        ...all.map(
          ([k, t]) =>
            new Property(this.CodeLocation, k, t.resolve_type(ctx), false)
        )
      ),
      ctx.Namespace,
      ctx.Using
    );

    const func = new FunctionEntity(
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
        ...all.map(
          ([k]) =>
            new SubStatement(
              this.CodeLocation,
              k,
              new AccessExpression(
                this.CodeLocation,
                new ReferenceExpression(this.CodeLocation, "_ctx"),
                k
              )
            )
        ),
        ...this.Body.iterator()
      ),
      this.Returns?.resolve_type(ctx) ??
        this.Body.resolve_block_type(ctx, name),
      ctx.Namespace,
      ctx.Using
    );

    ctx.AddGlobalFunction(func.Name, func);

    const instance = func.c(ctx);
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

    for (const [k, t] of all) {
      const val = t instanceof FunctionParameter ? k : t.c(ctx);
      ctx.AddPrefix(`${data_name}->${k} = ${val};`, `${data_name}->${k}`, [
        data_name,
        val,
      ]);
    }

    return instance;
  }

  compatible(target: Component, ctx: WriterContext): boolean {
    return this.resolve_type(ctx).compatible(target, ctx);
  }

  resolve_type(ctx: WriterContext): Component {
    const name = ctx.Callstack.join("__");
    const expected = [...this.Parameters.iterator()];
    const actual = [...(ctx.Invokation?.Parameters.iterator() ?? [])];
    const input: Array<FunctionParameter> = [];

    for (let i = 0; i < expected.length; i++) {
      const e = expected[i];
      RequireType(FunctionParameter, e);
      const a = actual[i];

      if (!a) {
        input.push(e);
        continue;
      }

      input.push(
        new FunctionParameter(
          e.CodeLocation,
          e.Name,
          a.resolve_type(ctx),
          e.Optional
        )
      );
    }
    const input_parameters: Record<string, Type> = {};

    for (const parameter of input) {
      RequireType(FunctionParameter, parameter);
      if (!parameter.Type)
        throw new LinkerError(
          parameter.CodeLocation,
          "Unable to resolve parameter type"
        );
      input_parameters[parameter.Name] = parameter.Type;
    }

    const resolve_ctx = ctx.WithFunctionParameters(
      new ComponentGroup(...input)
    );

    return new FunctionType(
      this.CodeLocation,
      new ComponentGroup(...input),
      this.Returns?.resolve_type(ctx) ??
        this.Body.resolve_block_type(resolve_ctx, name)
    );
  }
}
