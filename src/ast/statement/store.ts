import { ResolveExpressionType } from "../../linker/resolve";
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
    let prefix: Array<string> = [];
    let suffix: Array<string> = [];

    const type = ResolveExpressionType(this.Equals, ctx);

    ctx.locals[this.Name] = this;

    const expression = this.Equals.c(ctx);

    ctx.prefix.push(
      `${type.c(ctx)}* ${this.Name} = malloc(sizeof(${type.c(ctx)}));`
    );

    ctx.suffix.push(`free(${this.Name});`);

    ctx.prefix.push(`*${this.Name} = ${expression};`);

    return "*" + this.Name;
  }
}
