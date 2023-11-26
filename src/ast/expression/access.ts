import { LinkerError } from "../../linker/error";
import { IsAnyInvokable } from "../../linker/types";
import { CodeLocation } from "../../location/code-location";
import { PatternMatch } from "../../location/pattern-match";
import { Component } from "../component";
import { SchemaEntity } from "../entity/schema";
import { StructEntity } from "../entity/struct";
import { IterableType } from "../type/iterable";
import { PrimitiveType } from "../type/primitive";
import { SchemaType } from "../type/schema";
import { WriterContext } from "../writer";
import { Expression } from "./base";

export class AccessExpression extends Expression {
  readonly #subject: Component;
  readonly #target: string;

  constructor(ctx: CodeLocation, subject: Expression, target: string) {
    super(ctx);
    this.#subject = subject;
    this.#target = target;
  }

  get Subject() {
    return this.#subject;
  }

  get Target() {
    return this.#target;
  }

  get type_name() {
    return "access_expression";
  }

  c(ctx: WriterContext): string {
    return `${this.Subject.c(ctx)}.${this.Target}`;
  }

  resolve_type(ctx: WriterContext): Component {
    const subject = this.Subject.resolve_type(ctx);
    return PatternMatch(StructEntity, SchemaEntity, SchemaType, Component)(
      (struct) => {
        const result = struct.GetKey(this.Target);
        if (!result)
          throw new LinkerError(this.CodeLocation, "Cannot resolve access");

        return result.resolve_type(ctx);
      },
      (struct) => {
        const result = struct.GetKey(this.Target);
        if (!result)
          throw new LinkerError(this.CodeLocation, "Cannot resolve access");

        return result.resolve_type(ctx);
      },
      (struct) => {
        const result = struct.GetKey(this.Target);
        if (!result)
          throw new LinkerError(this.CodeLocation, "Cannot resolve access");

        return result.resolve_type(ctx);
      },
      () => {
        const target = ctx.FindReference(this.Target);
        if (!target || !IsAnyInvokable(target))
          throw new LinkerError(this.CodeLocation, "Could not resolve");

        return target;
      }
    )(subject);
  }
}
