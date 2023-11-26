import { Expression } from "./base";
import { Property } from "../property";
import { ReferenceExpression } from "./reference";
import { AccessExpression } from "./access";
import { ComponentGroup } from "../component-group";
import { WriterContext } from "../writer";
import { FunctionParameter } from "../function-parameter";
import { Type } from "../type/base";
import { StructEntity } from "../entity/struct";
import { FunctionEntity } from "../entity/function";
import { RawStatement } from "../statement/raw";
import { StoreStatement } from "../statement/store";
import { CodeLocation } from "../../location/code-location";
import { LinkerError } from "../../linker/error";
import { ResolveExpressionType, ResolveBlockType } from "../../linker/resolve";
import { Namer } from "../../location/namer";
import { RequireType } from "../../location/require-type";

export class LambdaExpression extends Expression {
  readonly #parameters: ComponentGroup;
  readonly #body: ComponentGroup;

  constructor(
    ctx: CodeLocation,
    parameters: ComponentGroup,
    body: ComponentGroup
  ) {
    super(ctx);
    this.#parameters = parameters;
    this.#body = body;
  }

  get Parameters() {
    return this.#parameters;
  }

  get Body() {
    return this.#body;
  }

  get type_name() {
    return "lambda_expression";
  }

  invoked(ctx: WriterContext) {
    const expected = [...this.Parameters.iterator()];
    const actual = [...(ctx.invokation?.Parameters.iterator() ?? [])];
    const input: Array<FunctionParameter> = [];

    for (let i = 0; i < expected.length; i++) {
      const e = expected[i];
      RequireType(FunctionParameter, e);
      const a = actual[i];

      if (!a) {
        input.push(e);
        continue;
      }

      input.push(
        new FunctionParameter(
          e.CodeLocation,
          e.Name,
          ResolveExpressionType(a, ctx),
          e.Optional
        )
      );
    }

    return new LambdaExpression(
      this.CodeLocation,
      new ComponentGroup(...input),
      this.Body
    );
  }

  c(ctx: WriterContext): string {
    const expected = [...this.Parameters.iterator()];
    const actual = [...(ctx.invokation?.Parameters.iterator() ?? [])];
    const parameters: Record<string, Type> = {};
    const func_parameters: Array<FunctionParameter> = [];

    for (let i = 0; i < expected.length; i++) {
      const e = expected[i];
      RequireType(FunctionParameter, e);
      const a = actual[i];
      if (!a) {
        if (!e.Type)
          throw new LinkerError(e.CodeLocation, "Canot determine type");
        parameters[e.Name] = e;
        func_parameters.push(e);
        continue;
      }

      const param = new FunctionParameter(
        this.CodeLocation,
        e.Name,
        ResolveExpressionType(a, ctx),
        false
      );
      parameters[e.Name] = param;
      func_parameters.push(param);
    }

    ctx = {
      ...ctx,
      parameters,
    };

    const name = Namer.GetName();
    const ctx_struct = new StructEntity(
      this.CodeLocation,
      true,
      name,
      new ComponentGroup(
        ...Object.keys(ctx.locals).map(
          (k) =>
            new Property(
              this.CodeLocation,
              k,
              ResolveExpressionType(ctx.locals[k], ctx),
              false
            )
        ),
        ...Object.keys(ctx.parameters).map(
          (k) => new Property(this.CodeLocation, k, ctx.parameters[k], false)
        )
      ),
      ctx.namespace,
      ctx.using
    );

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
        ...Object.keys(ctx.locals).map(
          (k) =>
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
        ...Object.keys(ctx.parameters).map(
          (k) =>
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
        ...this.Body.iterator()
      ),
      ResolveBlockType(this.Body, ctx),
      ctx.namespace,
      ctx.using
    );

    ctx.global_functions[func.Name] = func;

    const instance = func.c(ctx);
    const ctx_ref = ctx_struct.c(ctx);
    const data_name = Namer.GetName();
    ctx.prefix.push(`${instance}.data = malloc(sizeof(${ctx_ref}));`);
    ctx.prefix.push(
      `${ctx_ref}* ${data_name} = (${ctx_ref}*)${instance}.data;`
    );

    ctx.prefix.push(
      ...Object.keys(ctx.locals).map(
        (k) => `${data_name}->${k} = ${ctx.locals[k].c(ctx)};`
      ),
      ...Object.keys(ctx.parameters).map((k) => `${data_name}->${k} = ${k};`)
    );

    return instance;
  }
}
