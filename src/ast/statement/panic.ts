import { LinkerError } from "../../linker/error";
import { CodeLocation } from "../../location/code-location";
import { Component } from "../component";
import { Expression } from "../expression/base";
import { WriterContext } from "../writer";
import { Statement } from "./base";

export class PanicStatement extends Statement {
  readonly #value: Component;

  constructor(ctx: CodeLocation, value: Expression) {
    super(ctx);
    this.#value = value;
  }

  get Value() {
    return this.#value;
  }

  get type_name() {
    return "panic_statement";
  }

  c(ctx: WriterContext): string {
    const expression = this.Value.c(ctx);

    ctx.AddPrefix(`exit(${expression});`);

    return ``;
  }

  resolve_type(ctx: WriterContext): Component {
    throw new LinkerError(this.CodeLocation, "Should not be reachable");
  }
}
