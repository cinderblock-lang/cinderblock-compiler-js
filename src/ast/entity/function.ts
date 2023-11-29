import { LinkerError } from "../../linker/error";
import { CodeLocation } from "../../location/code-location";
import { Namer } from "../../location/namer";
import { RequireType, RequireOneOfType } from "../../location/require-type";
import { Component } from "../component";
import { ComponentGroup } from "../component-group";
import { FunctionParameter } from "../function-parameter";
import { Property } from "../property";
import { ReturnStatement } from "../statement/return";
import { SideStatement } from "../statement/side";
import { Type } from "../type/base";
import { FunctionType } from "../type/function";
import { IterableType } from "../type/iterable";
import { PrimitiveType } from "../type/primitive";
import { ReferenceType } from "../type/reference";
import { SchemaType } from "../type/schema";
import { UseType } from "../type/use";
import { WriterContext } from "../writer";
import { Entity } from "./base";
import { SchemaEntity } from "./schema";
import { StructEntity } from "./struct";

export class FunctionEntity extends Entity {
  readonly #name: string;
  readonly #unsafe: boolean;
  readonly #parameters: ComponentGroup;
  readonly #content: ComponentGroup;
  readonly #returns: Component | undefined;
  readonly #namespace: string;
  readonly #using: Array<string>;

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
    super(ctx, exported);
    this.#name = name;
    this.#unsafe = unsafe;
    this.#parameters = parameters;
    this.#content = content;
    this.#returns = returns;
    this.#namespace = namespace;
    this.#using = using;
  }

  get Name() {
    return this.#name;
  }

  get Parameters() {
    return this.#parameters;
  }

  get Content() {
    return this.#content;
  }

  get Returns() {
    return this.#returns;
  }

  get Namespace() {
    return this.#namespace;
  }

  get type_name() {
    return "function_entity";
  }

  get #full_name() {
    return this.#namespace.replace(/\./gm, "__") + "__" + this.Name;
  }

  #process_type(
    current: Component | undefined,
    invoking_with: Component,
    ctx: WriterContext
  ): { target: Type; uses: Record<string, Type> } {
    if (!current) return { target: invoking_with, uses: {} };
    if (current instanceof ReferenceType) current = current.resolve_type(ctx);
    if (current instanceof SchemaType || current instanceof SchemaEntity) {
      let uses: Record<string, Type> = {};

      RequireType(StructEntity, invoking_with);

      for (const property of current.Properties.iterator()) {
        RequireType(Property, property);
        const type = property.Type;

        const actual = invoking_with.GetKey(property.Name);
        if (!actual)
          throw new LinkerError(
            property.CodeLocation,
            "Cannot find matching property"
          );

        const { uses: additional } = this.#process_type(type, actual.Type, ctx);
        uses = { ...uses, ...additional };
      }

      return { target: invoking_with, uses };
    }

    if (current instanceof UseType) {
      return { target: invoking_with, uses: { [current.Name]: invoking_with } };
    }

    if (current instanceof IterableType) {
      RequireType(IterableType, invoking_with);
      const { uses } = this.#process_type(
        current.Type,
        invoking_with.Type,
        ctx
      );
      return { target: invoking_with, uses };
    }

    if (!current)
      throw new LinkerError(
        this.CodeLocation,
        "Could not resolve parameter type"
      );

    return { target: current, uses: {} };
  }

  #build_invokation_parameters(old_ctx: WriterContext) {
    const invokation = old_ctx.Invokation;
    let ctx = old_ctx.StartContext(
      this.CodeLocation,
      this.#namespace,
      this.#using
    );
    const expected = [...this.Parameters.iterator()];
    const actual = [...(invokation?.Parameters.iterator() ?? [])];
    const input: Array<FunctionParameter> = [
      new FunctionParameter(
        this.CodeLocation,
        "ctx",
        new PrimitiveType(this.CodeLocation, "null"),
        false
      ),
    ];

    for (let i = 0; i < expected.length; i++) {
      const e = expected[i];
      RequireType(FunctionParameter, e);
      const a = actual[i];

      if (!a) {
        input.push(e);
        if (!e.Type)
          throw new LinkerError(
            e.CodeLocation,
            "Cannot resolve function parameter type in this location"
          );

        ctx = ctx.WithFunctionParameter(e.Name, e);
        continue;
      }

      const { target, uses: updated } = this.#process_type(
        e.Type,
        a.resolve_type(old_ctx),
        ctx
      );
      ctx = ctx.WithUseTypes(updated);

      const param = new FunctionParameter(
        e.CodeLocation,
        e.Name,
        target,
        e.Optional
      );
      input.push(param);
      ctx = ctx.WithFunctionParameter(e.Name, param);
    }

    ctx = ctx.WithBody(this.Content, this.Name);

    return {
      input_parameters: input,
      returns: this.Content.resolve_block_type(ctx, this.Name),
      ctx,
    };
  }

  invoked(ctx_old: WriterContext) {
    const { input_parameters, returns, ctx } =
      this.#build_invokation_parameters(ctx_old);

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

  static #already_made: Array<string> = [];

  c(ctx_old: WriterContext, is_main = false): string {
    if (this.#unsafe && !ctx_old.AllowUnsafe)
      throw new LinkerError(
        this.CodeLocation,
        "Calling an unsafe function from a safe context"
      );

    ctx_old = ctx_old.WithUnsafeState(this.#unsafe);

    const { input_parameters, returns, ctx } =
      this.#build_invokation_parameters(ctx_old);

    for (const side of this.Content.find_all(SideStatement)) {
      side.c(ctx);
    }

    const body = this.Content.find(ReturnStatement).c(ctx);

    RequireOneOfType([Type, StructEntity], returns);
    if (is_main) {
      return `${returns.c(ctx)} ${this.Name}(${input_parameters
        .map((p) => {
          RequireType(FunctionParameter, p);
          const type = p.Type;
          if (!type)
            throw new LinkerError(p.CodeLocation, "Could not resolve type");

          RequireOneOfType([Type, StructEntity], type);
          return `${type.c(ctx)} ${p.Name}`;
        })
        .join(", ")}) {
        ${ctx.Prefix}
        ${ctx.Suffix}
        return ${body};
      }`;
    }

    if (!FunctionEntity.#already_made.includes(this.#full_name)) {
      FunctionEntity.#already_made.push(this.#full_name);
      const top_line = `${returns.c(ctx)} ${this.#full_name}(${input_parameters
        .map((p) => {
          RequireType(FunctionParameter, p);
          const type = p.Type;
          if (!type)
            throw new LinkerError(p.CodeLocation, "Could not resolve type");

          RequireOneOfType([Type, StructEntity], type);
          return `${type.c(ctx)} ${p.Name}`;
        })
        .join(", ")})`;
      ctx.AddGlobalDeclaration(`${top_line};`);
      ctx.AddGlobal(`${top_line} {
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
      `${struct} ${instance_name} = { &${this.#full_name}, NULL };`
    );

    return instance_name;
  }

  resolve_type(ctx_old: WriterContext): Component {
    const { input_parameters, returns, ctx } =
      this.#build_invokation_parameters(ctx_old);

    return new FunctionType(
      this.CodeLocation,
      new ComponentGroup(...input_parameters),
      returns.resolve_type(ctx)
    );
  }
}
