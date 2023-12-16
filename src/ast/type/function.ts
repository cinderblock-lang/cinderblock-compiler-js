import { CodeLocation } from "../../location/code-location";
import { Component } from "../component";
import { ComponentGroup } from "../component-group";
import { StructEntity } from "../entity/struct";
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
    return (
      target instanceof FunctionType &&
      target.#parameters.compatible(this.#parameters, ctx) &&
      this.#returns.compatible(target.#returns, ctx)
    );
  }

  resolve_type(ctx: WriterContext): Component {
    return this;
  }
}
