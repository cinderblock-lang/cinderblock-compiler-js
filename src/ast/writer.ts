import { LinkerError } from "../linker/error";
import { CodeLocation } from "../location/code-location";
import { RequireType } from "../location/require-type";
import { Component } from "./component";
import { ComponentGroup } from "./component-group";
import { BuiltInFunction } from "./entity/built-in-function";
import { ExternalFunctionDeclaration } from "./entity/external-function-declaration";
import { FunctionEntity } from "./entity/function";
import { SchemaEntity } from "./entity/schema";
import { StructEntity } from "./entity/struct";
import { InvokationExpression } from "./expression/invokation";
import { FunctionParameter } from "./function-parameter";
import { RawStatement } from "./statement/raw";
import { StoreStatement } from "./statement/store";
import { Type } from "./type/base";
import { PrimitiveType } from "./type/primitive";
import { Unique } from "./utils";

export type AnyFunction =
  | FunctionEntity
  | ExternalFunctionDeclaration
  | BuiltInFunction;

export type AnyType = StructEntity | SchemaEntity;

export type WriterContextProps = {
  global_functions: Record<string, AnyFunction>;
  global_types: Record<string, AnyType>;

  namespace: string;
  using: Array<string>;
  parameters: Record<string, Type>;
  locals: Record<string, Type>;

  use_types: Record<string, Type>;

  callstack?: Array<string>;

  invokation?: InvokationExpression;
  iterable?: Component;

  declaration?: Array<string>;
  prefix?: Array<[string, string, Array<string>]>;
  suffix?: Array<string>;
};

export class WriterContext {
  #global_functions: Record<string, AnyFunction>;
  #global_types: Record<string, AnyType>;

  #namespace: string;
  #using: Array<string>;
  #parameters: Record<string, Type>;
  #locals: Record<string, Type>;

  #use_types: Record<string, Type>;

  #invokation?: InvokationExpression;
  #iterable?: Component;

  #declaration: Array<string>;
  #prefix: Array<[string, string, Array<string>]>;
  #suffix: Array<string>;

  static #includes: Array<string> = ["<stdlib.h>", "<dlfcn.h>"];
  static #declarations: Array<string> = [];
  static #globals: Array<string> = [];

  #callstack: Array<string>;

  constructor(props: WriterContextProps) {
    this.#global_functions = props.global_functions;
    this.#global_types = props.global_types;

    this.#namespace = props.namespace;

    this.#using = props.using;
    this.#parameters = props.parameters;
    this.#locals = props.locals;
    this.#use_types = props.use_types;

    this.#invokation = props.invokation;
    this.#iterable = props.iterable;

    this.#declaration = props.declaration ?? [];
    this.#prefix = props.prefix ?? [];
    this.#suffix = props.suffix ?? [];
    this.#callstack = props.callstack ?? [];
  }

  get #props(): WriterContextProps {
    return {
      global_functions: this.#global_functions,
      global_types: this.#global_types,
      namespace: this.#namespace,
      using: this.#using,
      parameters: this.#parameters,
      locals: this.#locals,
      use_types: this.#use_types,
      invokation: this.#invokation,
      iterable: this.#iterable,
      prefix: this.#prefix,
      suffix: this.#suffix,
      callstack: this.#callstack,
      declaration: this.#declaration,
    };
  }

  get Invokation() {
    return this.#invokation;
  }

  get Namespace() {
    return this.#namespace;
  }

  get Using() {
    return this.#using;
  }

  AddGlobal(line: string) {
    WriterContext.#globals.push(line);
  }

  AddGlobalDeclaration(line: string) {
    WriterContext.#declarations.push(line);
  }

  AddInclude(line: string) {
    WriterContext.#includes.push(line);
  }

  WithUseTypes(input: Record<string, Type>) {
    return new WriterContext({
      ...this.#props,
      use_types: {
        ...this.#props.use_types,
        ...input,
      },
    });
  }

  WithFunctionParameter(name: string, type: FunctionParameter) {
    return new WriterContext({
      ...this.#props,
      parameters: {
        ...this.#props.parameters,
        [name]: type,
      },
    });
  }

  WithFunctionParameters(parameters: ComponentGroup) {
    const input_parameters: Record<string, Type> = {};

    for (const parameter of parameters.iterator()) {
      RequireType(FunctionParameter, parameter);
      if (!parameter.Type)
        throw new LinkerError(
          parameter.CodeLocation,
          "Unable to resolve parameter type"
        );
      input_parameters[parameter.Name] = parameter.Type;
    }

    return new WriterContext({
      ...this.#props,
      parameters: {
        ...this.#props.parameters,
        ...input_parameters,
      },
    });
  }

  FindType(name: string) {
    if (this.#use_types[name]) return this.#use_types[name];

    if (this.#global_types[this.#namespace + "." + name])
      return this.#global_types[this.#namespace + "." + name];

    const possible = this.#global_types[name];
    if (possible) return possible;

    for (const area of [...this.#using, "___BUILT_IN_CODE___"]) {
      const full = `${area}.${name}`;
      const possible = this.#global_types[full];
      if (!possible) continue;

      if (area === this.#namespace) return possible;

      if (possible.Exported) return possible;
    }

    return undefined;
  }

  FindReference(name: string) {
    if (this.#locals[name]) return this.#locals[name];

    if (this.#parameters[name]) return this.#parameters[name];

    if (this.#global_functions[this.#namespace + "." + name])
      return this.#global_functions[this.#namespace + "." + name];

    const possible = this.#global_functions[name];
    if (possible) return possible;

    for (const area of [...this.#using, "___BUILT_IN_CODE___"]) {
      const full = `${area}.${name}`;
      const possible = this.#global_functions[full];
      if (!possible) continue;

      if (possible instanceof BuiltInFunction) return possible;

      if (area === this.#namespace) return possible;

      if (possible instanceof ExternalFunctionDeclaration) continue;

      if (possible.Exported) return possible;
    }

    return undefined;
  }

  get CText() {
    return `${WriterContext.#includes
      .map((i) => `#include ${i}`)
      .join("\n")}\n\n${WriterContext.#declarations.join(
      "\n"
    )}\n\n${WriterContext.#globals.join("\n\n")}`;
  }

  get Prefix() {
    const final = this.#prefix
      .sort((a, b) => (a[2].includes(b[1]) ? -1 : 1))
      .filter(([n, v], i, a) =>
        Unique(
          v,
          i,
          a.map((a) => a[1])
        )
      );

    let result = this.#declaration.filter(Unique);

    for (let i = 0; i < final.length; i++) {
      const [name, value] = final[i];
      result.push(value);

      for (let b = 0; b < i; b++) {
        const [_name, _value, _depends_on] = final[b];
        if (_depends_on.includes(name)) result.push(_value);
      }
    }

    return result.join("\n");
  }

  get Suffix() {
    return this.#suffix.filter(Unique).join("\n");
  }

  get Locals() {
    return Object.keys(this.#locals).map((k) => [k, this.#locals[k]] as const);
  }

  get Parameters() {
    return Object.keys(this.#parameters).map(
      (k) => [k, this.#parameters[k]] as const
    );
  }

  AddDeclaration(line: string) {
    this.#declaration.push(line);
  }

  AddPrefix(line: string, name: string, depends_on: Array<string>) {
    this.#prefix.push([name, line, depends_on]);
  }

  AddSuffix(line: string) {
    this.#suffix.push(line);
  }

  StartContext(
    location: CodeLocation,
    namespace: string,
    using: Array<string>
  ) {
    return new WriterContext({
      ...this.#props,
      parameters: {
        ctx: new PrimitiveType(location, "null"),
      },
      locals: {},
      namespace,
      using,
      invokation: undefined,
    });
  }

  WithBody(content: ComponentGroup, name: string) {
    const input = { ...this.#locals };
    for (const statement of content.iterator()) {
      if (statement instanceof StoreStatement) {
        input[statement.Name] = statement;
      }

      if (statement instanceof RawStatement) {
        input[statement.Reference] = statement;
      }
    }

    return new WriterContext({
      ...this.#props,
      locals: input,
      declaration: [],
      prefix: [],
      suffix: [],
      callstack: [...(this.#props.callstack ?? []), name],
    });
  }

  WithInvokation(invokation: InvokationExpression) {
    return new WriterContext({
      ...this.#props,
      invokation: invokation,
    });
  }

  WithName(name: string) {
    return new WriterContext({
      ...this.#props,
      callstack: [...(this.#props.callstack ?? []), name],
    });
  }

  AddGlobalFunction(name: string, func: FunctionEntity) {
    this.#global_functions[name] = func;
  }

  AddGlobalStruct(name: string, struct: StructEntity) {
    this.#global_types[name] = struct;
  }

  get Callstack() {
    return this.#callstack;
  }

  WithIterable(iterable: Component) {
    return new WriterContext({
      ...this.#props,
      iterable,
    });
  }

  get Iterable() {
    return this.#iterable;
  }
}
