import { LinkerError } from "../../linker/error";
import { CodeLocation } from "../../location/code-location";
import { Namer } from "../../location/namer";
import { Component } from "../component";
import { ComponentGroup } from "../component-group";
import { FunctionParameter } from "../function-parameter";
import { PrimitiveType } from "../type/primitive";
import { WriterContext } from "../writer";
import { Expression } from "./base";

export class SystemExpression extends Expression {
  readonly #parameters: ComponentGroup;
  readonly #out_length: Expression;

  constructor(
    ctx: CodeLocation,
    parameters: ComponentGroup,
    out_length: Expression
  ) {
    super(ctx);
    this.#parameters = parameters;
    this.#out_length = out_length;
  }

  get type_name(): string {
    return "system_expression";
  }

  get UnsafeType() {
    return (
      [...this.#parameters.iterator()].find((p) => {
        return p instanceof FunctionParameter && p.Name === "out";
      }) as FunctionParameter | undefined
    )?.Type;
  }

  get OutType() {
    return this.UnsafeType ?? new PrimitiveType(this.CodeLocation, "int");
  }

  c(ctx: WriterContext): string {
    if (!ctx.AllowUnsafe)
      throw new LinkerError(this.CodeLocation, "Attempting in a safe context");
    ctx.AddInclude(`<sys/syscall.h>`);
    if (!this.UnsafeType) {
      return `syscall(${this.#parameters
        .map((p) => {
          if (p instanceof FunctionParameter && p.Name === "out") {
            return name;
          }

          return p.c(ctx);
        })
        .join(",")})`;
    }

    const type = this.resolve_type(ctx).c(ctx);
    const name = type.endsWith("*") ? Namer.GetName() : "*" + Namer.GetName();

    ctx.AddDeclaration(
      `${type} ${name} = malloc(sizeof(${type}) * ${this.#out_length.c(ctx)});`
    );

    ctx.AddPrefix(
      `syscall(${this.#parameters
        .map((p) => {
          if (p instanceof FunctionParameter && p.Name === "out") {
            return name;
          }

          return p.c(ctx);
        })
        .join(",")});`,
      name,
      []
    );

    return name;
  }

  compatible(target: Component, ctx: WriterContext): boolean {
    return this.OutType.compatible(target, ctx);
  }

  resolve_type(ctx: WriterContext): Component {
    return this.OutType.resolve_type(ctx);
  }

  default(ctx: WriterContext): string {
    throw new LinkerError(this.CodeLocation, "May not have a default");
  }
}
