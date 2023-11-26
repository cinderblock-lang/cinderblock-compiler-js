import { Expression } from "./base";
import { CodeLocation } from "../../location/code-location";
import { Component } from "../component";
import { ComponentGroup } from "../component-group";
import { WriterContext } from "../writer";
import { StoreStatement } from "../statement/store";
import { Namer } from "../../location/namer";
import { LambdaExpression } from "./lambda";
import { FunctionParameter } from "../function-parameter";
import { ReturnStatement } from "../statement/return";
import { MakeExpression } from "./make";
import { AssignStatement } from "../statement/assign";
import { AccessExpression } from "./access";
import { ReferenceExpression } from "./reference";
import { ReferenceType } from "../type/reference";
import { InvokationExpression } from "./invokation";
import { IterableType } from "../type/iterable";

export class IterateExpression extends Expression {
  readonly #over: Component;
  readonly #as: string;
  readonly #using: ComponentGroup;

  constructor(
    ctx: CodeLocation,
    over: Expression,
    as: string,
    using: ComponentGroup
  ) {
    super(ctx);
    this.#over = over;
    this.#as = as;
    this.#using = using;
  }

  get Over() {
    return this.#over;
  }

  get As() {
    return this.#as;
  }

  get Body() {
    return this.#using;
  }

  get type_name() {
    return "iterate_expression";
  }

  c(ctx: WriterContext): string {
    const main_name = Namer.GetName();
    const current_name = Namer.GetName();
    const wrapper_name = Namer.GetName();
    const start_name = Namer.GetName();

    const make = new MakeExpression(
      this.CodeLocation,
      "Array",
      new ComponentGroup(
        new StoreStatement(
          this.CodeLocation,
          Namer.GetName(),
          new LambdaExpression(
            this.CodeLocation,
            new ComponentGroup(
              new FunctionParameter(
                this.CodeLocation,
                this.As,
                this.Over.resolve_type(ctx),
                false
              )
            ),
            this.Body
          )
        ),
        new StoreStatement(
          this.CodeLocation,
          wrapper_name,
          new LambdaExpression(
            this.CodeLocation,
            new ComponentGroup(
              new FunctionParameter(
                this.CodeLocation,
                current_name,
                new ReferenceType(this.CodeLocation, "Array"),
                false
              )
            ),
            new ComponentGroup(
              new ReturnStatement(
                this.CodeLocation,
                new MakeExpression(
                  this.CodeLocation,
                  "Array",
                  new ComponentGroup(
                    new AssignStatement(
                      this.CodeLocation,
                      "done",
                      new AccessExpression(
                        this.CodeLocation,
                        new ReferenceExpression(
                          this.CodeLocation,
                          current_name
                        ),
                        "done"
                      )
                    ),
                    new AssignStatement(
                      this.CodeLocation,
                      "result",
                      new InvokationExpression(
                        this.CodeLocation,
                        new ReferenceExpression(this.CodeLocation, main_name),
                        new ComponentGroup(
                          new AccessExpression(
                            this.CodeLocation,
                            new ReferenceExpression(
                              this.CodeLocation,
                              current_name
                            ),
                            "result"
                          )
                        )
                      )
                    ),
                    new AssignStatement(
                      this.CodeLocation,
                      "next",
                      new LambdaExpression(
                        this.CodeLocation,
                        new ComponentGroup(),
                        new ComponentGroup(
                          new ReturnStatement(
                            this.CodeLocation,
                            new InvokationExpression(
                              this.CodeLocation,
                              new ReferenceExpression(
                                this.CodeLocation,
                                wrapper_name
                              ),
                              new ComponentGroup(
                                new InvokationExpression(
                                  this.CodeLocation,
                                  new AccessExpression(
                                    this.CodeLocation,
                                    new ReferenceExpression(
                                      this.CodeLocation,
                                      current_name
                                    ),
                                    "next"
                                  ),
                                  new ComponentGroup()
                                )
                              )
                            )
                          )
                        )
                      )
                    )
                  )
                )
              )
            )
          )
        ),
        new StoreStatement(this.CodeLocation, start_name, this.Over),
        new AssignStatement(
          this.CodeLocation,
          "done",
          new AccessExpression(
            this.CodeLocation,
            new ReferenceExpression(this.CodeLocation, start_name),
            "done"
          )
        ),
        new AssignStatement(
          this.CodeLocation,
          "next",
          new LambdaExpression(
            this.CodeLocation,
            new ComponentGroup(),
            new ComponentGroup(
              new ReturnStatement(
                this.CodeLocation,
                new InvokationExpression(
                  this.CodeLocation,
                  new ReferenceExpression(this.CodeLocation, wrapper_name),
                  new ComponentGroup(
                    new InvokationExpression(
                      this.CodeLocation,
                      new AccessExpression(
                        this.CodeLocation,
                        new ReferenceExpression(this.CodeLocation, start_name),
                        "next"
                      ),
                      new ComponentGroup()
                    )
                  )
                )
              )
            )
          )
        )
      )
    );

    return make.c(ctx);
  }

  resolve_type(ctx: WriterContext): Component {
    return new IterableType(
      this.CodeLocation,
      this.Body.resolve_block_type(
        ctx.WithFunctionParameter(
          this.As,
          new FunctionParameter(
            this.CodeLocation,
            this.As,
            this.Over.resolve_type(ctx),
            false
          )
        )
      )
    );
  }
}
