import { CodeLocation } from "../../location/code-location";
import { Component } from "../component";
import { Expression } from "../expression/base";
import { WriterContext } from "../writer";
import { Statement } from "./base";

export class StoreStatement extends Statement {
  readonly #name: string;
  readonly #equals: Component;

  constructor(ctx: CodeLocation, name: string, equals: Expression) {
    super(ctx);
    this.#name = name;
    this.#equals = equals;
  }

  get Name() {
    return this.#name;
  }

  get Equals() {
    return this.#equals;
  }

  get type_name() {
    return "store_statement";
  }

  c(ctx: WriterContext): string {
    const type = this.Equals.resolve_type(ctx);

    const expression = this.Equals.c(ctx);

    ctx.AddPrefix(
      `${type.c(ctx)}* ${this.Name} = malloc(sizeof(${type.c(ctx)}));`
    );

    ctx.AddSuffix(`free(${this.Name});`);

    ctx.AddPrefix(`*${this.Name} = ${expression};`);

    return "*" + this.Name;
  }

  resolve_type(ctx: WriterContext): Component {
    return this.Equals.resolve_type(ctx);
  }
}