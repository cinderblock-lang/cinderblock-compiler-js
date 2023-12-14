import { LinkerError } from "../../linker/error";
import { CodeLocation } from "../../location/code-location";
import { Namer } from "../../location/namer";
import { RequireType } from "../../location/require-type";
import { Component } from "../component";
import { ComponentGroup } from "../component-group";
import { FunctionParameter } from "../function-parameter";
import { Property } from "../property";
import { Type } from "../type/base";
import { FunctionType } from "../type/function";
import { IterableType } from "../type/iterable";
import { PrimitiveType } from "../type/primitive";
import { ReferenceType } from "../type/reference";
import { SchemaType } from "../type/schema";
import { UseType } from "../type/use";
import { WriterContext } from "../writer";
import { FunctionBaseEntity } from "./function-base";
import { SchemaEntity } from "./schema";
import { StructEntity } from "./struct";

export class BuiltInFunction extends FunctionBaseEntity {
  readonly #unsafe: boolean;
  readonly #source: string;
  readonly #requires: Array<string>;
  readonly #allocates: boolean;

  constructor(
    ctx: CodeLocation,
    name: string,
    unsafe: boolean,
    parameters: ComponentGroup,
    returns: Component,
    source: string,
    requires: Array<string>,
    allocates?: boolean
  ) {
    super(ctx, false, name, parameters, returns, "", []);
    this.#unsafe = unsafe;
    this.#source = source;
    this.#requires = requires;
    this.#allocates = allocates ?? false;
  }

  get Source() {
    return this.#source;
  }

  get Requires() {
    return this.#requires;
  }

  get Allocates() {
    return this.#allocates;
  }

  get type_name() {
    return "built_in_function";
  }

  static #already_made: Record<string, string> = {};

  build_invokation_parameters(old_ctx: WriterContext) {
    const result = super.build_invokation_parameters(old_ctx);
    if (!result.returns)
      throw new LinkerError(this.CodeLocation, "Could not resolve return type");
    return {
      input_parameters: result.input_parameters,
      returns: result.returns,
      ctx: result.ctx,
    };
  }

  c(ctx_old: WriterContext): string {
    if (this.#unsafe && !ctx_old.AllowUnsafe)
      throw new LinkerError(
        this.CodeLocation,
        "Calling an unsafe function from a safe context"
      );
    ctx_old = ctx_old.WithUnsafeState(this.#unsafe);
    const { input_parameters, returns, ctx } =
      this.build_invokation_parameters(ctx_old);

    const name = Namer.GetName();
    const write_name = Namer.GetName();
    const check_name =
      this.Name +
      input_parameters.map((p) => p.resolve_type(ctx).type_name).join("_");

    if (!BuiltInFunction.#already_made[check_name]) {
      BuiltInFunction.#already_made[check_name] = write_name;

      for (const requirement of this.Requires) ctx.AddInclude(requirement);
      const top_line = `${returns.c(ctx)} ${write_name}(${[
        "void* old_scope",
      ]
        .concat(
          ...input_parameters.map((p) => {
            RequireType(FunctionParameter, p);
            const type = p.Type;
            if (!type)
              throw new LinkerError(p.CodeLocation, "Could not resolve type");

            RequireType(Type, type);
            return `${type.c(ctx)} ${p.Name}`;
          })
        )
        .join(", ")})`;
      ctx.AddGlobalDeclaration(`${top_line};`);
      ctx.AddGlobal(`${top_line} {
        void* current_scope = _OpenScope(old_scope);
        ${this.Source}
      }`);
    }

    const struct = new FunctionType(
      this.CodeLocation,
      new ComponentGroup(...input_parameters),
      returns.resolve_type(ctx)
    ).c(ctx);

    ctx_old.AddDeclaration(
      `${struct} ${name} = _Allocate(current_scope, sizeof(${struct}));`
    );
    ctx_old.AddDeclaration(
      `${name}->handle = &${BuiltInFunction.#already_made[check_name]};`
    );

    return name;
  }

  resolve_type(ctx_old: WriterContext): Component {
    const { input_parameters, returns, ctx } =
      this.build_invokation_parameters(ctx_old);

    return new FunctionType(
      this.CodeLocation,
      new ComponentGroup(...input_parameters),
      returns.resolve_type(ctx)
    );
  }
}
