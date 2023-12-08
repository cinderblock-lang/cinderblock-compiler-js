import { LinkerError } from "../../linker/error";
import { CodeLocation } from "../../location/code-location";
import { Component } from "../component";
import { WriterContext } from "../writer";
import { Type } from "./base";

export class ReferenceType extends Type {
  readonly #name: string;

  constructor(ctx: CodeLocation, name: string) {
    super(ctx);
    this.#name = name;
  }

  get Name() {
    return this.#name;
  }

  get type_name() {
    return `ref_${this.Name}`;
  }

  c(ctx: WriterContext): string {
    return this.resolve_type(ctx).c(ctx);
  }

  resolve_type(ctx: WriterContext): Component {
    const result = ctx.FindType(this.Name)?.resolve_type(ctx);

    if (!result)
      throw new LinkerError(this.CodeLocation, "Could not resolve reference");

    return result;
  }
}
