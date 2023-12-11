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

  constructor(ctx: CodeLocation, parameters: ComponentGroup) {
    super(ctx);
    this.#parameters = parameters;
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

    const name = Namer.GetName();
    ctx.AddDeclaration(`${this.resolve_type(ctx).c(ctx)}* ${name};`);
    ctx.AddPrefix(
      `syscall(${this.#parameters
        .map((p) => {
          if (p instanceof FunctionParameter && p.Name === "out") {
            return name;
          }

          return p.c(ctx);
        })
        .join(",")});`,
      "*" + name,
      []
    );

    return "*" + name;
  }

  resolve_type(ctx: WriterContext): Component {
    return this.OutType.resolve_type(ctx);
  }
}
