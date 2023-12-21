import { CodeLocation } from "../../location/code-location";
import { Component } from "../component";
import { ComponentGroup } from "../component-group";
import { ReferenceExpression } from "../expression/reference";
import { RawStatement } from "../statement/raw";
import { ReturnStatement } from "../statement/return";
import { WriterContext } from "../writer";
import { FunctionEntity } from "./function";

export class BuiltInFunction extends FunctionEntity {
  readonly #requires: Array<string>;
  readonly #allocates: boolean;

  constructor(
    ctx: CodeLocation,
    name: string,
    unsafe: boolean,
    parameters: ComponentGroup,
    returns: Component,
    source: string,
    requires: Array<string>,
    allocates?: boolean
  ) {
    super(
      ctx,
      true,
      name,
      unsafe,
      parameters,
      new ComponentGroup(
        new RawStatement(ctx, source, "result", returns),
        new ReturnStatement(ctx, new ReferenceExpression(ctx, "result"))
      ),
      returns,
      "",
      []
    );
    this.#requires = requires;
    this.#allocates = allocates ?? false;
  }

  get Allocates() {
    return this.#allocates;
  }

  c(ctx_old: WriterContext, is_main?: boolean): string {
    for (const requirement of this.#requires) ctx_old.AddInclude(requirement);
    return super.c(ctx_old, is_main);
  }
}
