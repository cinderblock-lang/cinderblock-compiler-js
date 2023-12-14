import { LinkerError } from "../../linker/error";
import { CodeLocation } from "../../location/code-location";
import { Namer } from "../../location/namer";
import { RequireType, RequireOneOfType } from "../../location/require-type";
import { Component } from "../component";
import { ComponentGroup } from "../component-group";
import { FunctionParameter } from "../function-parameter";
import { ReturnStatement } from "../statement/return";
import { SideStatement } from "../statement/side";
import { Type } from "../type/base";
import { FunctionType } from "../type/function";
import { WriterContext } from "../writer";
import { EnumEntity } from "./enum";
import { FunctionBaseEntity } from "./function-base";
import { StructEntity } from "./struct";

export class FunctionEntity extends FunctionBaseEntity {
  readonly #unsafe: boolean;
  readonly #content: ComponentGroup;

  constructor(
    ctx: CodeLocation,
    exported: boolean,
    name: string,
    unsafe: boolean,
    parameters: ComponentGroup,
    content: ComponentGroup,
    returns: Component | undefined,
    namespace: string,
    using: Array<string>
  ) {
    super(ctx, exported, name, parameters, returns, namespace, using);
    this.#unsafe = unsafe;
    this.#content = content;
  }

  get Content() {
    return this.#content;
  }

  get type_name() {
    return "function_entity";
  }

  static #already_made: Record<string, string> = {};

  build_invokation_parameters(old_ctx: WriterContext) {
    const result = super.build_invokation_parameters(old_ctx);
    result.ctx = result.ctx.WithBody(this.Content, this.Name);

    return {
      input_parameters: result.input_parameters,
      returns:
        result.returns ??
        this.Content.resolve_block_type(result.ctx, this.Name),
      ctx: result.ctx,
    };
  }

  invoked(ctx_old: WriterContext) {
    const { input_parameters, returns, ctx } =
      this.build_invokation_parameters(ctx_old);

    return new FunctionEntity(
      this.CodeLocation,
      this.Exported,
      this.Name,
      this.#unsafe,
      new ComponentGroup(...input_parameters),
      this.Content,
      returns,
      ctx.Namespace,
      ctx.Using
    );
  }

  c(ctx_old: WriterContext, is_main = false): string {
    if (this.#unsafe && !ctx_old.AllowUnsafe)
      throw new LinkerError(
        this.CodeLocation,
        "Calling an unsafe function from a safe context"
      );

    ctx_old = ctx_old.WithUnsafeState(this.#unsafe);

    const { input_parameters, returns, ctx } =
      this.build_invokation_parameters(ctx_old);

    for (const side of this.Content.find_all(SideStatement)) {
      side.c(ctx);
    }

    RequireOneOfType([Type, StructEntity, EnumEntity], returns);
    if (is_main) {
      const body = this.Content.find(ReturnStatement).c(ctx);
      return `${returns.c(ctx)} ${this.Name}(${input_parameters
        .map((p) => {
          RequireType(FunctionParameter, p);
          const type = p.Type;
          if (!type)
            throw new LinkerError(p.CodeLocation, "Could not resolve type");

          RequireOneOfType([Type, StructEntity, EnumEntity], type);
          return `${type.c(ctx)} ${p.CName}`;
        })
        .join(", ")}) {
        void* current_scope = _OpenScope(NULL);
        ${ctx.Prefix}
        ${ctx.Suffix}
        return ${body};
      }`;
    }

    const write_name = Namer.GetName();
    const name_check =
      this.full_name +
      input_parameters.map((p) => p.resolve_type(ctx).type_name).join("_");
    if (!FunctionEntity.#already_made[name_check]) {
      FunctionEntity.#already_made[name_check] = write_name;
      const body = this.Content.find(ReturnStatement).c(ctx);
      const top_line = `${returns.c(ctx)} ${write_name}(${[
        "void* old_scope",
      ]
        .concat(
          ...input_parameters.map((p) => {
            RequireType(FunctionParameter, p);
            const type = p.Type;
            if (!type)
              throw new LinkerError(p.CodeLocation, "Could not resolve type");

            RequireOneOfType([Type, StructEntity, EnumEntity], type);
            return `${type.c(ctx)} ${p.CName}`;
          })
        )
        .join(", ")})`;
      ctx.AddGlobalDeclaration(`${top_line};`);
      ctx.AddGlobal(`${top_line} {
          void* current_scope = _OpenScope(old_scope);
          ${ctx.Prefix}
          ${ctx.Suffix}
          return ${body};
      }`);
    }

    const struct = new FunctionType(
      this.CodeLocation,
      new ComponentGroup(...input_parameters),
      returns
    ).c(ctx);

    const instance_name = Namer.GetName();
    ctx_old.AddDeclaration(
      `${struct} ${instance_name} = _Allocate(current_scope, sizeof(${struct}));`
    );
    ctx_old.AddDeclaration(
      `${instance_name}->handle = &${FunctionEntity.#already_made[name_check]};`
    );

    return instance_name;
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
