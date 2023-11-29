import { EmptyCodeLocation } from "../location/empty";
import { Namer } from "../location/namer";
import { PatternMatch } from "../location/pattern-match";
import { RequireType } from "../location/require-type";
import { Component } from "./component";
import { ComponentGroup } from "./component-group";
import { BuiltInFunction } from "./entity/built-in-function";
import { ExternalFunctionDeclaration } from "./entity/external-function-declaration";
import { FunctionEntity } from "./entity/function";
import { SchemaEntity } from "./entity/schema";
import { StructEntity } from "./entity/struct";
import { TestEntity } from "./entity/test";
import { UsingEntity } from "./entity/using";
import { IfExpression } from "./expression/if";
import { InvokationExpression } from "./expression/invokation";
import { LiteralExpression } from "./expression/literal";
import { ReferenceExpression } from "./expression/reference";
import { Namespace } from "./namespace";
import { RawStatement } from "./statement/raw";
import { ReturnStatement } from "./statement/return";
import { SideStatement } from "./statement/side";
import { StoreStatement } from "./statement/store";
import { PrimitiveType } from "./type/primitive";
import { AnyFunction, AnyType, WriterContext } from "./writer";

export class Ast {
  readonly #data: Array<Component>;

  constructor(...data: Array<ComponentGroup>) {
    this.#data = data.flatMap((d) => [...d.iterator()]);
  }

  *iterator() {
    for (const item of this.#data) yield item;
  }

  with(input: ComponentGroup) {
    return new Ast(new ComponentGroup(...this.#data), input);
  }

  get #globals() {
    const global_functions: Record<string, AnyFunction> = {};
    const global_types: Record<string, AnyType> = {};

    for (const namespace of this.iterator()) {
      RequireType(Namespace, namespace);

      for (const entity of namespace.Contents.iterator()) {
        PatternMatch(
          FunctionEntity,
          ExternalFunctionDeclaration,
          BuiltInFunction,
          StructEntity,
          SchemaEntity,
          UsingEntity
        )(
          (f) => {
            global_functions[namespace.Name + "." + f.Name] = f;
          },
          (f) => {
            global_functions[namespace.Name + "." + f.Name] = f;
          },
          (f) => {
            global_functions[f.Name] = f;
          },
          (f) => {
            global_types[namespace.Name + "." + f.Name] = f;
          },
          (f) => {
            global_types[namespace.Name + "." + f.Name] = f;
          },
          (f) => {}
        )(entity);
      }
    }

    return { global_functions, global_types };
  }

  c(): string {
    const { global_functions, global_types } = this.#globals;
    for (const namespace of this.iterator()) {
      RequireType(Namespace, namespace);
      if (namespace.Name !== "App") continue;

      for (const entity of namespace.Contents.iterator()) {
        if (!(entity instanceof FunctionEntity)) continue;
        if (entity.Name !== "main") continue;

        const ctx = new WriterContext({
          global_functions,
          global_types,
          namespace: "App",
          using: [],
          parameters: {},
          locals: {},
          use_types: {},
        });

        const c = entity.c(ctx, true);

        return `${ctx.CText}\n\n${c}`;
      }
    }

    throw new Error("Could not find a main function");
  }

  c_test(): string {
    const { global_functions, global_types } = this.#globals;

    const state_name = Namer.GetName();

    const failure_message = "Some tests failed. Check the logs above.";
    const failure_message_length = failure_message.length;

    const success_message = "All tests passed!";
    const success_message_length = success_message.length;

    const ctx = new WriterContext({
      global_functions,
      global_types,
      namespace: "App",
      using: [],
      parameters: {},
      locals: {},
      use_types: {},
    });

    const functions = [...this.iterator()].flatMap((namespace) => {
      RequireType(Namespace, namespace);

      return namespace.Contents.find_all(TestEntity).map(
        (t) => [t.c(ctx, false), t.Description] as const
      );
    });

    ctx.AddInclude("<stdio.h>");

    ctx.AddGlobal(`int main() {
      _Bool failures = 0;

      ${ctx.Prefix}

      ${functions
        .map(
          ([f, d]) => `
        _Bool (*${f}_h)() = ${f}.handle;
        printf("Running test: ${d}\\n");
        if (!(*${f}_h)()) {
          printf("Test Failed\\n\\n\\n");
          failures = 1;
        } else {
          printf("Test Passed\\n\\n\\n");
        }
      `
        )
        .join("\n")}

      ${ctx.Suffix}

      if (failures) {
        printf("You had some failues.\\n");
        return 1;
      }

      printf("All tests passed!\\n");
      return 0;
    }`);
    return `${ctx.CText}`;
  }
}
