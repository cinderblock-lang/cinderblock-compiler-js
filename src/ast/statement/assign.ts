import { LinkerError } from "../../linker/error";
import { CodeLocation } from "../../location/code-location";
import { Namer } from "../../location/namer";
import { Component } from "../component";
import { Expression } from "../expression/base";
import { PrimitiveType } from "../type/primitive";
import { WriterContext } from "../writer";
import { Statement } from "./base";

export class AssignStatement extends Statement {
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
    return "assign_statement";
  }

  c(ctx: WriterContext, assignee?: string): string {
    const expression = this.Equals.c(ctx);
    const type = this.Equals.resolve_type(ctx);
    const name = Namer.GetName();

    if (assignee && !(type instanceof PrimitiveType))
      ctx.AddPrefix(
        `${type.c(
          ctx
        )} ${name} = _Assign(current_scope, ${expression}, ${assignee});`,
        name,
        [expression]
      );
    else
      ctx.AddPrefix(`${type.c(ctx)} ${name} = ${expression};`, name, [
        expression,
      ]);

    return name;
  }

  resolve_type(ctx: WriterContext): Component {
    throw new LinkerError(this.CodeLocation, "Should not be reachable");
  }
}
