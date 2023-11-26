import { PatternMatch } from "../location/pattern-match";
import { RequireType } from "../location/require-type";
import { Component } from "./component";
import { ComponentGroup } from "./component-group";
import { BuiltInFunction } from "./entity/built-in-function";
import { ExternalFunctionDeclaration } from "./entity/external-function-declaration";
import { FunctionEntity } from "./entity/function";
import { SchemaEntity } from "./entity/schema";
import { StructEntity } from "./entity/struct";
import { UsingEntity } from "./entity/using";
import { Namespace } from "./namespace";
import { AnyFunction, AnyType } from "./writer";

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

  c(): string {
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

    for (const namespace of this.iterator()) {
      RequireType(Namespace, namespace);
      if (namespace.Name !== "App") continue;

      for (const entity of namespace.Contents.iterator()) {
        if (!(entity instanceof FunctionEntity)) continue;
        if (entity.Name !== "main") continue;

        const includes: Array<string> = ["<stdlib.h>", "<dlfcn.h>"];
        const globals: Array<string> = [];

        const prefix: Array<string> = [];
        const suffix: Array<string> = [];

        const c = entity.c({
          global_functions,
          global_types,
          namespace: "App",
          using: [],
          parameters: {},
          locals: {},
          use_types: {},

          prefix,
          suffix,
          file: {
            add_global: (line) => globals.unshift(line),
            add_include: (line) => includes.unshift(line),
          },
        });

        return `${includes.map((i) => `#include ${i}`).join("\n")}\n\n${globals
          .reverse()
          .join("\n\n")}\n\n${c}`;
      }
    }

    throw new Error("Could not find a main function");
  }
}
