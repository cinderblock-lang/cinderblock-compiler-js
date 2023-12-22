import { LinkerError } from "../../linker/error";
import { CodeLocation } from "../../location/code-location";
import { Component } from "../component";
import { Expression } from "../expression/base";
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

  c(ctx: WriterContext): string {
    const expression = this.Equals.c(ctx);
    const type = this.Equals.resolve_type(ctx);

    ctx.AddPrefix(`${type.c(ctx)} ${this.Name} = ${expression};`, this.Name, [
      expression,
    ]);

    return this.Name;
  }

  compatible(target: Component, ctx: WriterContext): boolean {
    return (
      target instanceof AssignStatement &&
      this.Equals.compatible(target.Equals, ctx)
    );
  }

  resolve_type(ctx: WriterContext): Component {
    throw new LinkerError(this.CodeLocation, "Should not be reachable");
  }

  default(ctx: WriterContext): string {
    throw new LinkerError(this.CodeLocation, "May not have a default");
  }
}
