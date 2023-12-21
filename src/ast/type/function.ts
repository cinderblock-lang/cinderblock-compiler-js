import { CodeLocation } from "../../location/code-location";
import { RequireType } from "../../location/require-type";
import { Component } from "../component";
import { ComponentGroup } from "../component-group";
import { StructEntity } from "../entity/struct";
import { InvokationExpression } from "../expression/invokation";
import { FunctionParameter } from "../function-parameter";
import { WriterContext } from "../writer";
import { Type } from "./base";

export class FunctionType extends Type {
  readonly #parameters: ComponentGroup;
  readonly #returns: Component;

  constructor(
    ctx: CodeLocation,
    parameters: ComponentGroup,
    returns: Type | StructEntity
  ) {
    super(ctx);
    this.#parameters = parameters;
    this.#returns = returns;
  }

  get Parameters() {
    return this.#parameters;
  }

  get Returns() {
    return this.#returns;
  }

  get type_name() {
    return `func_${this.Parameters.map((p) => p.type_name).join("_")}`;
  }

  get extra_json() {
    return {
      parameters: this.#parameters.json,
      returns: this.#returns,
    };
  }

  static #already_written = false;

  c(ctx: WriterContext): string {
    if (!FunctionType.#already_written) {
      FunctionType.#already_written = true;
      ctx.AddGlobalDeclaration(
        `typedef struct _FUNCTION { void* handle; void* data; } _FUNCTION;`
      );
    }
    return "_FUNCTION";
  }

  compatible(target: Component, ctx: WriterContext): boolean {
    if (target instanceof FunctionType) {
      if (
        !new ComponentGroup(
          ...target.#parameters.filter((p) => {
            RequireType(FunctionParameter, p);
            return p.Name !== "ctx" && p.Type?.type_name !== "prim_null";
          })
        ).compatible(
          new ComponentGroup(
            ...this.#parameters
              .filter((p) => {
                RequireType(FunctionParameter, p);
                return p.Name !== "ctx" && p.Type?.type_name !== "prim_null";
              })
              .map((p) => p.resolve_type(ctx))
          ),
          ctx,
          true
        )
      )
        return false;

      if (
        !this.#returns
          .resolve_type(ctx)
          .compatible(target.#returns.resolve_type(ctx), ctx)
      )
        return false;

      return true;
    } else if (target instanceof InvokationExpression) {
      return new ComponentGroup(
        ...target.Parameters.map((p) => p.resolve_type(ctx))
      ).compatible(
        new ComponentGroup(
          ...this.#parameters
            .filter((p) => {
              RequireType(FunctionParameter, p);
              return !(p.Name === "ctx" && p.Type?.type_name === "prim_null");
            })
            .map((p) => p.resolve_type(ctx))
        ),
        ctx,
        true
      );
    }
    return false;
  }

  resolve_type(ctx: WriterContext): Component {
    return this;
  }
}
