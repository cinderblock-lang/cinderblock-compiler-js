import { LinkerError } from "../../linker/error";
import {
  ResolveType,
  ResolveExpressionType,
  ResolveBlockType,
} from "../../linker/resolve";
import { CodeLocation } from "../../location/code-location";
import { Namer } from "../../location/namer";
import { RequireType, RequireOneOfType } from "../../location/require-type";
import { Component } from "../component";
import { ComponentGroup } from "../component-group";
import { FunctionParameter } from "../function-parameter";
import { Property } from "../property";
import { RawStatement } from "../statement/raw";
import { ReturnStatement } from "../statement/return";
import { StoreStatement } from "../statement/store";
import { Type } from "../type/base";
import { FunctionType } from "../type/function";
import { PrimitiveType } from "../type/primitive";
import { ReferenceType } from "../type/reference";
import { SchemaType } from "../type/schema";
import { UseType } from "../type/use";
import { Unique } from "../utils";
import { WriterContext } from "../writer";
import { Entity } from "./base";
import { SchemaEntity } from "./schema";
import { StructEntity } from "./struct";

export class FunctionEntity extends Entity {
  readonly #name: string;
  readonly #parameters: ComponentGroup;
  readonly #content: ComponentGroup;
  readonly #returns: Component | undefined;
  readonly #namespace: string;
  readonly #using: Array<string>;

  constructor(
    ctx: CodeLocation,
    exported: boolean,
    name: string,
    parameters: ComponentGroup,
    content: ComponentGroup,
    returns: Component | undefined,
    namespace: string,
    using: Array<string>
  ) {
    super(ctx, exported);
    this.#name = name;
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
    if (current instanceof ReferenceType) current = ResolveType(current, ctx);
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

    if (!current)
      throw new LinkerError(
        this.CodeLocation,
        "Could not resolve parameter type"
      );

    return { target: current, uses: {} };
  }

  #build_invokation_parameters(old_ctx: WriterContext) {
    const ctx: WriterContext = {
      ...old_ctx,
      parameters: {
        ctx: new PrimitiveType(this.CodeLocation, "null"),
      },
      use_types: {},
      locals: {},
      namespace: this.#namespace,
      using: this.#using,
    };
    const invokation = ctx.invokation;
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

        ctx.parameters[e.Name] = e;
        continue;
      }

      const { target, uses: updated } = this.#process_type(
        e.Type,
        ResolveExpressionType(a, old_ctx),
        ctx
      );
      ctx.use_types = { ...ctx.use_types, ...updated };

      const param = new FunctionParameter(
        e.CodeLocation,
        e.Name,
        target,
        e.Optional
      );
      input.push(param);
      ctx.parameters[e.Name] = param;
    }

    for (const statement of this.Content.iterator()) {
      if (statement instanceof StoreStatement) {
        ctx.locals[statement.Name] = statement;
      }

      if (statement instanceof RawStatement) {
        ctx.locals[statement.Reference] = statement;
      }
    }

    return {
      input_parameters: input,
      returns: ResolveBlockType(this.Content, ctx),
      ctx,
    };
  }

  invoked(ctx_old: WriterContext) {
    ctx_old = { ...ctx_old, namespace: this.#namespace, using: this.#using };
    const { input_parameters, returns, ctx } =
      this.#build_invokation_parameters(ctx_old);

    return new FunctionEntity(
      this.CodeLocation,
      this.Exported,
      this.Name,
      new ComponentGroup(...input_parameters),
      this.Content,
      returns,
      ctx.namespace,
      ctx.using
    );
  }

  static #already_made: Array<string> = [];

  c(ctx_old: WriterContext): string {
    const { input_parameters, returns, ctx } =
      this.#build_invokation_parameters(ctx_old);

    const prefix: Array<string> = [];
    const suffix: Array<string> = [];

    const body = this.Content.find(ReturnStatement).c({
      ...ctx,
      prefix,
      suffix,
    });
    RequireType(Type, returns);
    if (this.Name === "main" && ctx.namespace === "App") {
      return `${returns.c(ctx)} ${this.Name}(${input_parameters
        .map((p) => {
          RequireType(FunctionParameter, p);
          const type = p.Type;
          if (!type)
            throw new LinkerError(p.CodeLocation, "Could not resolve type");

          RequireType(Type, type);
          return `${type.c(ctx)} ${p.Name}`;
        })
        .join(", ")}) {
        ${prefix.join("\n")}
        ${suffix.join("\n")}
        return ${body};
      }`;
    }

    if (!FunctionEntity.#already_made.includes(this.#full_name)) {
      FunctionEntity.#already_made.push(this.#full_name);
      ctx.file.add_global(`${returns.c(ctx)} ${
        this.#full_name
      }(${input_parameters
        .map((p) => {
          RequireType(FunctionParameter, p);
          const type = p.Type;
          if (!type)
            throw new LinkerError(p.CodeLocation, "Could not resolve type");

          RequireOneOfType([Type, StructEntity], type);
          return `${type.c(ctx)} ${p.Name}`;
        })
        .join(", ")}) {
          ${prefix.filter(Unique).join("\n")}
          ${suffix.filter(Unique).join("\n")}
          return ${body};
      }`);
    }

    const struct = new FunctionType(
      this.CodeLocation,
      new ComponentGroup(...input_parameters),
      returns
    ).c({ ...ctx });

    const instance_name = Namer.GetName();
    ctx.prefix.push(
      `${struct} ${instance_name} = { &${this.#full_name}, NULL };`
    );

    return instance_name;
  }
}
