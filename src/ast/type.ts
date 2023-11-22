import { Location } from "#compiler/location";
import { Component, ComponentGroup } from "./base";
import { StructEntity } from "./entity";
import { Property } from "./property";

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

  get type_name() {
    return "schema_type";
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
}

export class IterableType extends Type {
  readonly #type: Component;

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
}
