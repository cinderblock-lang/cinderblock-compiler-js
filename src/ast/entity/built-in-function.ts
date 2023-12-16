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
import { SchemaEntity } from "./schema";
import { StructEntity } from "./struct";

export class BuiltInFunction extends Component {
  readonly #name: string;
  readonly #unsafe: boolean;
  readonly #parameters: ComponentGroup;
  readonly #returns: Component;
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
    super(ctx);
    this.#name = name;
    this.#unsafe = unsafe;
    this.#parameters = parameters;
    this.#returns = returns;
    this.#source = source;
    this.#requires = requires;
    this.#allocates = allocates ?? false;
  }

  get Name() {
    return this.#name;
  }

  get Parameters() {
    return this.#parameters;
  }

  get Returns() {
    return this.#returns;
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
    let ctx = old_ctx.StartContext(this.CodeLocation, "", []);
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
        if (e.Optional) {
          const param = new FunctionParameter(
            e.CodeLocation,
            e.Name,
            new PrimitiveType(e.CodeLocation, "null"),
            true
          );
          ctx = ctx.WithFunctionParameter(e.Name, param);
          input.push(param);
        } else {
          if (!e.Type)
            throw new LinkerError(
              e.CodeLocation,
              "Cannot resolve function parameter type in this location"
            );
          ctx = ctx.WithFunctionParameter(e.Name, e);
          input.push(e);
        }

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

    return {
      input_parameters: input,
      returns: this.Returns?.resolve_type(ctx),
      ctx,
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
      this.#build_invokation_parameters(ctx_old);

    const name = Namer.GetName();
    const write_name = Namer.GetName();
    const check_name =
      this.Name +
      input_parameters.map((p) => p.resolve_type(ctx).type_name).join("_");

    if (!BuiltInFunction.#already_made[check_name]) {
      BuiltInFunction.#already_made[check_name] = write_name;

      for (const requirement of this.Requires) ctx.AddInclude(requirement);
      const top_line = `${returns.c(ctx)} ${write_name}(${input_parameters
        .map((p) => {
          RequireType(FunctionParameter, p);
          const type = p.Type;
          if (!type)
            throw new LinkerError(p.CodeLocation, "Could not resolve type");

          RequireType(Type, type);
          return `${type.c(ctx)} ${p.Name}`;
        })
        .join(", ")})`;
      ctx.AddGlobalDeclaration(`${top_line};`);
      ctx.AddGlobal(`${top_line} {
        ${this.Source}
      }`);
    }

    const struct = new FunctionType(
      this.CodeLocation,
      new ComponentGroup(...input_parameters),
      returns.resolve_type(ctx)
    ).c(ctx);

    ctx.AddDeclaration(
      `${struct} ${name} = { &${
        BuiltInFunction.#already_made[check_name]
      }, NULL };`
    );

    return name;
  }

  compatible(target: Component): boolean {
    return false;
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
