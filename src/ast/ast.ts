import { PatternMatch } from "../location/pattern-match";
import { RequireType } from "../location/require-type";
import { Component } from "./component";
import { ComponentGroup } from "./component-group";
import { BuiltInFunction } from "./entity/built-in-function";
import { EnumEntity } from "./entity/enum";
import { ExternalFunctionDeclaration } from "./entity/external-function-declaration";
import { ExternalStructEntity } from "./entity/external-struct-declaration";
import { FunctionEntity } from "./entity/function";
import { LibEntity } from "./entity/lib";
import { SchemaEntity } from "./entity/schema";
import { StructEntity } from "./entity/struct";
import { SystemEntity } from "./entity/system";
import { TestEntity } from "./entity/test";
import { UsingEntity } from "./entity/using";
import { Namespace } from "./namespace";
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
          BuiltInFunction,
          StructEntity,
          SchemaEntity,
          UsingEntity,
          EnumEntity,
          SystemEntity,
          LibEntity
        )(
          (f) => {
            global_functions[namespace.Name + "." + f.Name] = f;
          },
          (f) => {
            global_functions[namespace.Name + "." + f.Name] = f;
          },
          (f) => {
            global_types[namespace.Name + "." + f.Name] = f;
          },
          (f) => {
            global_types[namespace.Name + "." + f.Name] = f;
          },
          (f) => {},
          (e) => {
            global_types[namespace.Name + "." + e.Name] = e;
          },
          sys => {
            WriterContext.AddInclude(`<${sys.Name}>`);
            for (const item of sys.Content.iterator()) {
              PatternMatch(
                ExternalFunctionDeclaration,
                ExternalStructEntity
              )(
                f => {
                  global_functions[namespace.Name + "." + f.Name] = f;
                },
                f => {
                  global_types[namespace.Name + "." + f.Name] = f;
                },
              )(item)
            }
          },
          sys => {
            WriterContext.AddInclude(`"${sys.Name}"`);
            for (const item of sys.Content.iterator()) {
              PatternMatch(
                ExternalFunctionDeclaration,
                ExternalStructEntity
              )(
                f => {
                  global_functions[namespace.Name + "." + f.Name] = f;
                },
                f => {
                  global_types[namespace.Name + "." + f.Name] = f;
                },
              )(item)
            }
          }
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

    const ctx = new WriterContext({
      global_functions,
      global_types,
      namespace: "App",
      using: [],
      parameters: {},
      locals: {},
      use_types: {},
    });

    const functions = [...this.iterator()]
      .filter((c) => !c.CodeLocation.FileName.includes(".cinder_cache"))
      .flatMap((namespace) => {
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
