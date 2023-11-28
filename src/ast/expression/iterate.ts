import { Expression } from "./base";
import { CodeLocation } from "../../location/code-location";
import { Component } from "../component";
import { ComponentGroup } from "../component-group";
import { WriterContext } from "../writer";
import { StoreStatement } from "../statement/store";
import { Namer } from "../../location/namer";
import { FunctionParameter } from "../function-parameter";
import { ReturnStatement } from "../statement/return";
import { MakeExpression } from "./make";
import { AssignStatement } from "../statement/assign";
import { AccessExpression } from "./access";
import { ReferenceExpression } from "./reference";
import { InvokationExpression } from "./invokation";
import { IterableType } from "../type/iterable";
import { FunctionEntity } from "../entity/function";
import { StructEntity } from "../entity/struct";
import { Property } from "../property";
import { RawStatement } from "../statement/raw";
import { PrimitiveType } from "../type/primitive";
import { IfExpression } from "./if";
import { OperatorExpression } from "./operator";
import { LiteralExpression } from "./literal";

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
    const index_name = Namer.GetName();
    const parent_name = Namer.GetName();
    const ctx_name = Namer.GetName();
    const all = [...ctx.Locals, ...ctx.Parameters].filter(([k]) => k !== "ctx");

    const returns = this.Body.resolve_block_type(
      ctx.WithFunctionParameter(
        this.As,
        new FunctionParameter(
          this.CodeLocation,
          this.As,
          this.Over.resolve_type(ctx),
          false
        )
      ),
      "iterate"
    );

    const func_parameters: Array<FunctionParameter> = [
      new FunctionParameter(
        this.CodeLocation,
        index_name,
        new PrimitiveType(this.CodeLocation, "int"),
        false
      ),
    ];

    const over_type = this.Over.resolve_type(ctx);

    const name = Namer.GetName();
    const ctx_struct = new StructEntity(
      this.CodeLocation,
      true,
      name,
      new ComponentGroup(
        new Property(this.CodeLocation, parent_name, over_type, false),
        ...all.map(
          ([k, t]) =>
            new Property(this.CodeLocation, k, t.resolve_type(ctx), false)
        )
      ),
      ctx.Namespace,
      ctx.Using
    );

    const nullptr_name = Namer.GetName();

    const result = this.resolve_type(ctx).Result;
    ctx.AddGlobalStruct(result.Name, result);

    const func = new FunctionEntity(
      this.CodeLocation,
      true,
      Namer.GetName(),
      new ComponentGroup(...func_parameters),
      new ComponentGroup(
        new RawStatement(
          this.CodeLocation,
          `${ctx_struct.c(ctx)} _ctx = *(${ctx_struct.c(ctx)}*)ctx;`,
          "_ctx",
          ctx_struct
        ),
        new StoreStatement(
          this.CodeLocation,
          parent_name,
          new AccessExpression(
            this.CodeLocation,
            new ReferenceExpression(this.CodeLocation, "_ctx"),
            parent_name
          )
        ),
        ...all.map(
          ([k]) =>
            new StoreStatement(
              this.CodeLocation,
              k,
              new AccessExpression(
                this.CodeLocation,
                new ReferenceExpression(this.CodeLocation, "_ctx"),
                k
              )
            )
        ),
        new StoreStatement(
          this.CodeLocation,
          ctx_name,
          new InvokationExpression(
            this.CodeLocation,
            new ReferenceExpression(this.CodeLocation, parent_name),
            new ComponentGroup(
              new ReferenceExpression(this.CodeLocation, index_name)
            )
          )
        ),
        new ReturnStatement(
          this.CodeLocation,
          new MakeExpression(
            this.CodeLocation,
            result.Name,
            new ComponentGroup(
              new AssignStatement(
                this.CodeLocation,
                "done",
                new OperatorExpression(
                  this.CodeLocation,
                  new AccessExpression(
                    this.CodeLocation,
                    new ReferenceExpression(this.CodeLocation, ctx_name),
                    "done"
                  ),
                  "==",
                  new LiteralExpression(this.CodeLocation, "bool", "true")
                )
              ),
              new AssignStatement(
                this.CodeLocation,
                "result",
                new IfExpression(
                  this.CodeLocation,
                  new OperatorExpression(
                    this.CodeLocation,
                    new AccessExpression(
                      this.CodeLocation,
                      new ReferenceExpression(this.CodeLocation, ctx_name),
                      "done"
                    ),
                    "==",
                    new LiteralExpression(this.CodeLocation, "bool", "false")
                  ),
                  this.Body,
                  new ComponentGroup(
                    new RawStatement(
                      this.CodeLocation,
                      `${returns.c(ctx)} ${nullptr_name};`,
                      nullptr_name,
                      returns
                    ),
                    new ReturnStatement(
                      this.CodeLocation,
                      new ReferenceExpression(this.CodeLocation, nullptr_name)
                    )
                  )
                )
              )
            )
          )
        ),
        ...this.Body.iterator()
      ),
      this.Body.resolve_block_type(ctx, "iterate"),
      ctx.Namespace,
      ctx.Using
    );

    ctx.AddGlobalFunction(func.Name, func);

    const instance = func.c(ctx);
    const ctx_ref = ctx_struct.c(ctx);
    const data_name = Namer.GetName();
    ctx.AddPrefix(`${instance}.data = malloc(sizeof(${ctx_ref}));`, name, [
      instance,
    ]);
    ctx.AddPrefix(
      `${ctx_ref}* ${data_name} = (${ctx_ref}*)${instance}.data;`,
      data_name,
      [instance]
    );

    for (const [k, t] of all) {
      const val = t instanceof FunctionParameter ? k : t.c(ctx);
      ctx.AddPrefix(`${data_name}->${k} = ${val};`, `${data_name}->${k}`, [
        data_name,
        val,
      ]);
    }

    const over = this.Over.c(ctx);
    ctx.AddPrefix(
      `${data_name}->${parent_name} = ${over};`,
      `${data_name}->${parent_name}`,
      [data_name, over]
    );

    return instance;
  }

  resolve_type(ctx: WriterContext): IterableType {
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
        ),
        "iterate"
      )
    );
  }
}
