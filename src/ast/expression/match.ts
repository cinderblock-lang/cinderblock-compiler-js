import { Expression } from "./base";
import { ComponentGroup } from "../component-group";
import { WriterContext } from "../writer";
import { Component } from "../component";
import { CodeLocation } from "../../location/code-location";
import { LinkerError } from "../../linker/error";
import { Namer } from "../../location/namer";
import { RequireType } from "../../location/require-type";
import { EnumEntity } from "../entity/enum";
import { ReturnStatement } from "../statement/return";
import { RawStatement } from "../statement/raw";

export class MatchExpression extends Expression {
  readonly #subject: Expression;
  readonly #as: string;
  readonly #using: Record<string, ComponentGroup>;

  constructor(
    ctx: CodeLocation,
    subject: Expression,
    as: string,
    using: Record<string, ComponentGroup>
  ) {
    super(ctx);
    this.#subject = subject;
    this.#as = as;
    this.#using = using;
  }

  get Subject() {
    return this.#subject;
  }

  get type_name() {
    return "pick_expression";
  }

  c(ctx: WriterContext): string {
    const type = this.Subject.resolve_type(ctx);
    if (!type)
      throw new LinkerError(this.CodeLocation, "Could not resolve symbol");
    RequireType(EnumEntity, type);
    const name = Namer.GetName();
    const item_name = Namer.GetName();

    const returns = this.resolve_type(ctx);

    ctx.AddPrefix(`${returns.c(ctx)} ${name};`, name, []);
    const subject = this.Subject.c(ctx);
    ctx.AddPrefix(`${type.c(ctx)} ${item_name} = ${subject};`, item_name, [
      subject,
    ]);

    for (const key in this.#using) {
      const item_type = type.GetKey(key)?.Type;
      const index = type.GetKeyIndex(key);

      if (!item_type)
        throw new LinkerError(this.CodeLocation, "Could not resolve key");

      const storage = new RawStatement(
        this.CodeLocation,
        `${item_type.c(ctx)} ${this.#as} = *(${item_type.c(
          ctx
        )}*)${item_name}.data;`,
        this.#as,
        item_type
      );

      const item_ctx = ctx
        .WithLocal(this.#as, storage)
        .WithBody(this.#using[key], key);
      const item_return = this.#using[key].find(ReturnStatement).c(item_ctx);

      ctx.AddPrefix(
        `if (${item_name}.type == ${index}) {
        ${item_ctx.Prefix}
        ${name} = ${item_return};
        ${item_ctx.Suffix}
      }`,
        name + key,
        [item_name, name]
      );
    }

    return name;
  }

  compatible(target: Component, ctx: WriterContext): boolean {
    return this.resolve_type(ctx).compatible(target, ctx);
  }

  resolve_type(ctx: WriterContext): Component {
    const type = this.Subject.resolve_type(ctx);
    if (!type)
      throw new LinkerError(this.CodeLocation, "Could not resolve symbol");
    RequireType(EnumEntity, type);

    const using_key = Object.keys(this.#using)[0];
    const using_type = type.GetKey(using_key)?.Type;
    if (!using_type)
      throw new LinkerError(this.CodeLocation, "Could not resolve key");

    const using = this.#using[using_key];
    const returns = using.resolve_block_type(
      ctx.WithLocal(this.#as, using_type),
      "res"
    );

    return returns;
  }
}
