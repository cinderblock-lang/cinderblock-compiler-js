import { Location, Namer } from "#compiler/location";
import { LinkerError } from "../linker/error";
import { ResolveType } from "../linker/resolve";
import { RequireOneOfType, RequireType } from "../location/pattern-match";
import { Component, ComponentGroup, WriterContext } from "./base";
import { StructEntity } from "./entity";
import { FunctionParameter, Property } from "./property";

export abstract class Type extends Component {}

export class SchemaType extends Type {
  readonly #properties: ComponentGroup;

  constructor(ctx: Location, properties: ComponentGroup) {
    super(ctx);
    this.#properties = properties;
  }

  get Properties() {
    return this.#properties;
  }

  HasKey(key: string) {
    for (const property of this.#properties.iterator())
      if (property instanceof Property) if (property.Name === key) return true;

    return false;
  }

  GetKey(key: string) {
    for (const property of this.#properties.iterator())
      if (property instanceof Property)
        if (property.Name === key) return property;

    return undefined;
  }

  IsCompatible(subject: StructEntity): boolean {
    throw new Error("Not yet implemented");
  }

  get type_name() {
    return "schema_type";
  }

  c(ctx: WriterContext): string {
    throw new LinkerError(
      this.Location,
      "May not have a schema in the compiled code"
    );
  }
}

export class ReferenceType extends Type {
  readonly #name: string;

  constructor(ctx: Location, name: string) {
    super(ctx);
    this.#name = name;
  }

  get Name() {
    return this.#name;
  }

  get type_name() {
    return "reference_type";
  }

  c(ctx: WriterContext): string {
    return ResolveType(this, ctx).c(ctx);
  }
}

export const PrimitiveNames = [
  "int",
  "char",
  "double",
  "float",
  "bool",
  "long",
  "any",
  "string",
  "null",
] as const;

export type PrimitiveName = (typeof PrimitiveNames)[number];

export function IsPrimitiveName(input: string): input is PrimitiveName {
  return PrimitiveNames.includes(input as any);
}

export class PrimitiveType extends Type {
  readonly #name: PrimitiveName;

  constructor(ctx: Location, name: PrimitiveName) {
    super(ctx);
    this.#name = name;
  }

  copy() {
    return new PrimitiveType(this.Location, this.Name);
  }

  get Name() {
    return this.#name;
  }

  get type_name() {
    return "primitive_type";
  }

  c(ctx: WriterContext): string {
    switch (this.Name) {
      case "any":
        return "void*";
      case "bool":
        return "_Bool";
      case "char":
        return "char";
      case "float":
        return "float";
      case "double":
        return "double";
      case "int":
        return "int";
      case "long":
        return "long";
      case "string":
        return "char*";
      case "null":
        return "void*";
    }
  }
}

export class IterableType extends Type {
  readonly #type: Type;

  constructor(ctx: Location, type: Type) {
    super(ctx);
    this.#type = type;
  }

  get Type() {
    return this.#type;
  }

  get type_name() {
    return "iterable_type";
  }

  c(ctx: WriterContext): string {
    return `Array`;
  }
}

export class FunctionType extends Type {
  readonly #parameters: ComponentGroup;
  readonly #returns: Component;

  constructor(
    ctx: Location,
    parameters: ComponentGroup,
    returns: Type | StructEntity
  ) {
    super(ctx);
    this.#parameters = parameters;
    this.#returns = returns;
  }

  get Parameters() {
    return this.#parameters;
  }

  get Returns() {
    return this.#returns;
  }

  get type_name() {
    return "function_type";
  }

  get extra_json() {
    return {
      parameters: this.#parameters.json,
      returns: this.#returns,
    };
  }

  // static #written: Record<string, string> = {};
  static #already_written = false;

  c(ctx: WriterContext): string {
    // const id =
    //   this.Parameters.map((p) => p.constructor.name).join("_") +
    //   "_" +
    //   this.Returns.constructor.name;
    // if (FunctionType.#written[id]) return FunctionType.#written[id];

    // const name = Namer.GetName();
    // FunctionType.#written[id] = name;
    // ctx.file.add_global(
    //   `typedef ${this.Returns.c(ctx)} (*${name}_func)(${this.Parameters.map(
    //     (p) => {
    //       RequireType(FunctionParameter, p);
    //       const type = p.Type;
    //       if (!type)
    //         throw new LinkerError(p.Location, "Could not resolve type");

    //       RequireOneOfType([Type, StructEntity], type);
    //       return `${type.c(ctx)} ${p.Name}`;
    //     }
    //   ).join(", ")});`
    // );

    // ctx.file.add_global(`typedef struct ${name} {
    //   ${name}_func handle;
    //   void* data;
    // } ${name};`);


    if (!FunctionType.#already_written) {
      FunctionType.#already_written = true;
      ctx.file.add_global(
        `typedef struct _FUNCTION { void* handle; void* data; } _FUNCTION;`
      );
    }
    return "_FUNCTION";
  }
}

export class UseType extends Type {
  readonly #name: string;
  readonly #constraints: ComponentGroup;

  constructor(ctx: Location, name: string, constraints: ComponentGroup) {
    super(ctx);
    this.#name = name;
    this.#constraints = constraints;
  }

  copy() {
    return this;
  }

  get Name() {
    return this.#name;
  }

  get Constraints() {
    return this.#constraints;
  }

  get type_name() {
    return "use_type";
  }

  c(ctx: WriterContext): string {
    throw new LinkerError(
      this.Location,
      "Use must not be in the concrete implementation"
    );
  }
}
