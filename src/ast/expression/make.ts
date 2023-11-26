import { Expression } from "./base";
import { Unique } from "../utils";
import { ComponentGroup } from "../component-group";
import { WriterContext } from "../writer";
import { Component } from "../component";
import { StoreStatement } from "../statement/store";
import { RawStatement } from "../statement/raw";
import { AssignStatement } from "../statement/assign";
import { CodeLocation } from "../../location/code-location";
import { LinkerError } from "../../linker/error";
import { FindType } from "../../linker/resolve";
import { Namer } from "../../location/namer";

export class MakeExpression extends Expression {
  readonly #struct: string;
  readonly #using: ComponentGroup;

  constructor(ctx: CodeLocation, struct: string, using: ComponentGroup) {
    super(ctx);
    this.#struct = struct;
    this.#using = using;
  }

  get Struct() {
    return this.#struct;
  }

  get Using() {
    return this.#using;
  }

  get type_name() {
    return "make_expression";
  }

  c(ctx: WriterContext): string {
    const type = FindType(this.Struct, ctx);
    if (!type)
      throw new LinkerError(this.CodeLocation, "Could not resolve symbol");
    const name = Namer.GetName();
    ctx.prefix.push(`${type.c(ctx)} ${name} = malloc(sizeof(${type.c(ctx)}))`);

    let locals: Record<string, Component> = {};
    for (const statement of this.Using.iterator()) {
      if (statement instanceof StoreStatement) {
        locals[statement.Name] = statement;
      }

      if (statement instanceof RawStatement) {
        locals[statement.Reference] = statement;
      }
    }

    const prefix: Array<string> = [];
    const suffix: Array<string> = [];
    const inputs = this.Using.find_all(AssignStatement).map(
      (a) =>
        `${name}->${a.Name} = ${a.c({
          ...ctx,
          prefix,
          suffix,
          locals,
        })};`
    );

    ctx.prefix.push(`{
      ${prefix.filter(Unique).join("\n")}
      ${inputs.join("\n")}
      ${suffix.filter(Unique).join("\n")}
    }`);

    return `*${name}`;
  }
}
