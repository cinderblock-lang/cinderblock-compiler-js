import { Component, ComponentGroup } from "./base";
import { Property } from "./property";
import { Type } from "./type";
import { Location } from "#compiler/location";
import { Expression } from "./expression";

export abstract class Entity extends Component {
  readonly #exported: boolean;

  constructor(ctx: Location, exported: boolean) {
    super(ctx);
    this.#exported = exported;
  }

  get Exported() {
    return this.#exported;
  }
}

export class FunctionEntity extends Entity {
  readonly #name: string;
  readonly #parameters: ComponentGroup;
  readonly #content: ComponentGroup;
  readonly #returns: Component | undefined;

  constructor(
    ctx: Location,
    exported: boolean,
    name: string,
    parameters: ComponentGroup,
    content: ComponentGroup,
    returns: Component | undefined
  ) {
    super(ctx, exported);
    this.#name = name;
    this.#parameters = parameters;
    this.#content = content;
    this.#returns = returns;
  }

  get Name() {
    return this.#name;
  }

  get Parameters() {
    return this.#parameters;
  }

  get Content() {
    return this.#content;
  }

  get Returns() {
    return this.#returns;
  }

  get type_name() {
    return "function_entity";
  }
}

export class StructEntity extends Entity {
  readonly #name: string;
  readonly #properties: ComponentGroup;

  constructor(
    ctx: Location,
    exported: boolean,
    name: string,
    properties: ComponentGroup
  ) {
    super(ctx, exported);
    this.#name = name;
    this.#properties = properties;
  }

  get Name() {
    return this.#name;
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
    return "struct_entity";
  }
}

export class SchemaEntity extends Entity {
  readonly #name: string;
  readonly #properties: ComponentGroup;

  constructor(
    ctx: Location,
    exported: boolean,
    name: string,
    properties: ComponentGroup
  ) {
    super(ctx, exported);
    this.#name = name;
    this.#properties = properties;
  }

  get Name() {
    return this.#name;
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
    return "schema_entity";
  }
}

export class UsingEntity extends Entity {
  readonly #name: string;

  constructor(ctx: Location, exported: boolean, name: string) {
    super(ctx, exported);
    this.#name = name;
  }

  get Name() {
    return this.#name;
  }

  get type_name() {
    return "using_entity";
  }
}

export class ExternalFunctionDeclaration extends Component {
  readonly #name: string;
  readonly #parameters: ComponentGroup;
  readonly #returns: Component;

  constructor(
    ctx: Location,
    name: string,
    parameters: ComponentGroup,
    returns: Type
  ) {
    super(ctx);
    this.#name = name;
    this.#parameters = parameters;
    this.#returns = returns;
  }

  get Name() {
    return this.#name;
  }

  get Returns() {
    return this.#returns;
  }

  get Parameters() {
    return this.#parameters;
  }

  get type_name() {
    return "external_function_declaration";
  }
}

export class LibEntity extends Entity {
  readonly #name: Component;
  readonly #content: ComponentGroup;

  constructor(
    ctx: Location,
    exported: boolean,
    name: Expression,
    content: ComponentGroup
  ) {
    super(ctx, exported);
    this.#name = name;
    this.#content = content;
  }

  get Name() {
    return this.#name;
  }

  get Content() {
    return this.#content;
  }

  get type_name() {
    return "lib_entity";
  }
}

export class SystemEntity extends Entity {
  readonly #content: ComponentGroup;

  constructor(ctx: Location, exported: boolean, content: ComponentGroup) {
    super(ctx, exported);
    this.#content = content;
  }

  get Content() {
    return this.#content;
  }

  get type_name() {
    return "system_entity";
  }

  get more_json() {
    return {
      content: this.#content.json,
    };
  }
}

export class BuiltInFunction extends Component {
  readonly #name: string;
  readonly #parameters: ComponentGroup;
  readonly #returns: Component;
  readonly #source: string;
  readonly #requires: Array<string>;
  readonly #allocates: boolean;

  constructor(
    ctx: Location,
    name: string,
    parameters: ComponentGroup,
    returns: Component,
    source: string,
    requires: Array<string>,
    allocates?: boolean
  ) {
    super(ctx);
    this.#name = name;
    this.#parameters = parameters;
    this.#returns = returns;
    this.#source = source;
    this.#requires = requires;
    this.#allocates = allocates ?? false;
  }

  get Name() {
    return this.#name;
  }

  get Parameters() {
    return this.#parameters;
  }

  get Returns() {
    return this.#returns;
  }

  get Source() {
    return this.#source;
  }

  get Requires() {
    return this.#requires;
  }

  get Allocates() {
    return this.#allocates;
  }

  get type_name() {
    return "built_in_function";
  }
}
