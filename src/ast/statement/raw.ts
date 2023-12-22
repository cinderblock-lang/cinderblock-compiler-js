import { LinkerError } from "../../linker/error";
import { CodeLocation } from "../../location/code-location";
import { Component } from "../component";
import { WriterContext } from "../writer";
import { Statement } from "./base";

export class RawStatement extends Statement {
  readonly #c_code: string;
  readonly #reference: string;
  readonly #creates: Component;

  constructor(
    location: CodeLocation,
    c_code: string,
    reference: string,
    creates: Component
  ) {
    super(location);
    this.#c_code = c_code;
    this.#reference = reference;
    this.#creates = creates;
  }

  get Reference() {
    return this.#reference;
  }

  get Creates() {
    return this.#creates;
  }

  get type_name(): string {
    return "raw_statement";
  }

  c(ctx: WriterContext): string {
    ctx.AddPrefix(this.#c_code, this.Reference, []);
    return this.#reference;
  }

  compatible(target: Component, ctx: WriterContext): boolean {
    return this.Creates.compatible(target, ctx);
  }

  resolve_type(ctx: WriterContext): Component {
    return this.Creates.resolve_type(ctx);
  }

  default(ctx: WriterContext): string {
    throw new LinkerError(this.CodeLocation, "May not have a default");
  }
}
