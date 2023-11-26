import { ResolveType } from "../../linker/resolve";
import { CodeLocation } from "../../location/code-location";
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
    return "reference_type";
  }

  c(ctx: WriterContext): string {
    return ResolveType(this, ctx).c(ctx);
  }
}
