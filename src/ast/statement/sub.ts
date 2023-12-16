import { CodeLocation } from "../../location/code-location";
import { Namer } from "../../location/namer";
import { Component } from "../component";
import { Expression } from "../expression/base";
import { WriterContext } from "../writer";
import { Statement } from "./base";

export class SubStatement extends Statement {
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
    return "sub_statement";
  }

  static #written: Record<string, string> = {};

  c(ctx: WriterContext): string {
    const name = ctx.Callstack.join("__") + "__" + this.Name;

    if (SubStatement.#written[name]) {
      return SubStatement.#written[name];
    }
    const id = Namer.GetName();
    SubStatement.#written[name] = "*" + id;

    const type = this.Equals.resolve_type(ctx);

    const expression = this.Equals.c(ctx);

    ctx.AddDeclaration(
      `${type.c(ctx)}* ${id} = malloc(sizeof(${type.c(ctx)}));`
    );

    ctx.AddSuffix(`free(${id});`);

    ctx.AddPrefix(`*${id} = ${expression};`, SubStatement.#written[name], [
      expression,
    ]);
    return SubStatement.#written[name];
  }

  resolve_type(ctx: WriterContext): Component {
    return this.Equals.resolve_type(ctx);
  }
}
