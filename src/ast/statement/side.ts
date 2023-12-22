import { LinkerError } from "../../linker/error";
import { CodeLocation } from "../../location/code-location";
import { Component } from "../component";
import { Expression } from "../expression/base";
import { PrimitiveType } from "../type/primitive";
import { WriterContext } from "../writer";
import { Statement } from "./base";

export class SideStatement extends Statement {
  readonly #value: Component;

  constructor(ctx: CodeLocation, value: Expression) {
    super(ctx);
    this.#value = value;
  }

  get Value() {
    return this.#value;
  }

  get type_name() {
    return "side_statement";
  }

  c(ctx: WriterContext): string {
    if (!ctx.AllowUnsafe)
      throw new LinkerError(
        this.CodeLocation,
        "May not have side effects outside of an unsafe context"
      );
    const expression = this.Value.c(ctx);
    ctx.AddPrefix(`${expression};`, "return", [expression]);

    return "NULL";
  }

  compatible(target: Component): boolean {
    return false;
  }

  resolve_type(ctx: WriterContext): Component {
    return new PrimitiveType(this.CodeLocation, "null");
  }

  default(ctx: WriterContext): string {
    throw new LinkerError(this.CodeLocation, "May not have a default");
  }
}
