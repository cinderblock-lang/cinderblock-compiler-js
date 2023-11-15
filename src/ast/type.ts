import { Location } from "#compiler/location";
import { AstItem, Component, ComponentGroup, ComponentStore } from "./base";
import { StructEntity } from "./entity";
import { Property } from "./property";

export abstract class Type extends Component {}

@AstItem
export class SchemaType extends Type {
  readonly #properties: ComponentGroup;

  constructor(ctx: Location, properties: ComponentGroup) {
    super(ctx);
    this.#properties = properties;
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

  get extra_json() {
    return {
      properties: this.#properties.json,
    };
  }
}

@AstItem
export class ReferenceType extends Type {
  readonly #name: string;
  readonly #references?: number;

  constructor(ctx: Location, name: string, references?: Component) {
    super(ctx);
    this.#name = name;
    this.#references = references?.Index;
  }

  get Name() {
    return this.#name;
  }

  get References() {
    return this.#references ? ComponentStore.Get(this.#references) : undefined;
  }

  get type_name() {
    return "reference_type";
  }

  get extra_json() {
    return {
      name: this.#name,
      references: this.#references,
    };
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
] as const;

export type PrimitiveName = (typeof PrimitiveNames)[number];

export function IsPrimitiveName(input: string): input is PrimitiveName {
  return PrimitiveNames.includes(input as any);
}

@AstItem
export class PrimitiveType extends Type {
  readonly #name: PrimitiveName;

  constructor(ctx: Location, name: PrimitiveName) {
    super(ctx);
    this.#name = name;
  }

  get type_name() {
    return "primitive_type";
  }

  get extra_json() {
    return {
      name: this.#name,
    };
  }
}

@AstItem
export class IterableType extends Type {
  readonly #type: number;

  constructor(ctx: Location, type: Type) {
    super(ctx);
    this.#type = type.Index;
  }

  get Type() {
    return ComponentStore.Get(this.#type);
  }

  get type_name() {
    return "iterable_type";
  }

  get extra_json() {
    return {
      type_name: this.#type,
    };
  }
}

@AstItem
export class FunctionType extends Type {
  readonly #parameters: ComponentGroup;
  readonly #returns: number;

  constructor(
    ctx: Location,
    parameters: ComponentGroup,
    returns: Type | StructEntity
  ) {
    super(ctx);
    this.#parameters = parameters;
    this.#returns = returns.Index;
  }

  get Returns() {
    return ComponentStore.Get(this.#returns);
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

@AstItem
export class UseType extends Type {
  readonly #name: string;
  readonly #constraints: ComponentGroup;

  constructor(ctx: Location, name: string, constraints: ComponentGroup) {
    super(ctx);
    this.#name = name;
    this.#constraints = constraints;
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

  get extra_json() {
    return {
      name: this.#name,
      constraints: this.#constraints.json,
    };
  }
}
