import { AstItem, Component, ComponentGroup, ComponentStore } from "./base";
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

  abstract get more_json(): Record<never, never>;

  get extra_json() {
    return {
      ...this.more_json,
      exported: this.#exported,
    };
  }
}

@AstItem
export class FunctionEntity extends Entity {
  readonly #name: string;
  readonly #parameters: ComponentGroup;
  readonly #returns: number | undefined;
  readonly #content: ComponentGroup;

  constructor(
    ctx: Location,
    exported: boolean,
    name: string,
    parameters: ComponentGroup,
    returns: Type | undefined,
    content: ComponentGroup
  ) {
    super(ctx, exported);
    this.#name = name;
    this.#parameters = parameters;
    this.#returns = returns?.Index;
    this.#content = content;
  }

  copy() {
    return new FunctionEntity(
      this.Location,
      this.Exported,
      this.#name,
      this.#parameters.copy(),
      this.Returns?.copy(),
      this.#content.copy()
    );
  }

  get Name() {
    return this.#name;
  }

  get Parameters() {
    return this.#parameters;
  }
  get Returns() {
    return this.#returns ? ComponentStore.Get(this.#returns) : undefined;
  }

  get Content() {
    return this.#content;
  }

  get type_name() {
    return "function_entity";
  }

  get more_json() {
    return {
      name: this.#name,
      parameters: this.#parameters.json,
      returns: this.#returns,
      content: this.#content.json,
    };
  }
}

@AstItem
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

  copy() {
    return new StructEntity(
      this.Location,
      this.Exported,
      this.#name,
      this.Properties.copy()
    );
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

  get more_json() {
    return {
      name: this.#name,
      properties: this.#properties.json,
    };
  }
}

@AstItem
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

  copy() {
    return this;
  }

  get Name() {
    return this.#name;
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

  get more_json() {
    return {
      name: this.#name,
      properties: this.#properties.json,
    };
  }
}

@AstItem
export class UsingEntity extends Entity {
  readonly #name: string;

  constructor(ctx: Location, exported: boolean, name: string) {
    super(ctx, exported);
    this.#name = name;
  }

  copy() {
    return new UsingEntity(this.Location, this.Exported, this.#name);
  }

  get Name() {
    return this.#name;
  }

  get type_name() {
    return "using_entity";
  }

  get more_json() {
    return {
      name: this.#name,
    };
  }
}

@AstItem
export class ExternalFunctionDeclaration extends Component {
  readonly #name: string;
  readonly #parameters: ComponentGroup;
  readonly #returns: number;

  constructor(
    ctx: Location,
    name: string,
    parameters: ComponentGroup,
    returns: Type
  ) {
    super(ctx);
    this.#name = name;
    this.#parameters = parameters;
    this.#returns = returns.Index;
  }

  copy() {
    return new ExternalFunctionDeclaration(
      this.Location,
      this.#name,
      this.#parameters.copy(),
      this.Returns.copy()
    );
  }

  get Name() {
    return this.#name;
  }

  get Returns() {
    return ComponentStore.Get(this.#returns);
  }

  get Parameters() {
    return this.#parameters;
  }

  get type_name() {
    return "external_function_declaration";
  }

  get extra_json() {
    return {
      name: this.#name,
      parameters: this.#parameters.json,
      returns: this.#returns,
    };
  }
}

@AstItem
export class LibEntity extends Entity {
  readonly #name: number;
  readonly #content: ComponentGroup;

  constructor(
    ctx: Location,
    exported: boolean,
    name: Expression,
    content: ComponentGroup
  ) {
    super(ctx, exported);
    this.#name = name.Index;
    this.#content = content;
  }

  copy() {
    return new LibEntity(
      this.Location,
      this.Exported,
      this.Name.copy(),
      this.#content.copy()
    );
  }

  get Name() {
    return ComponentStore.Get(this.#name);
  }

  get Content() {
    return this.#content;
  }

  get type_name() {
    return "lib_entity";
  }

  get more_json() {
    return {
      name: this.#name,
      content: this.#content.json,
    };
  }
}

@AstItem
export class SystemEntity extends Entity {
  readonly #content: ComponentGroup;

  constructor(ctx: Location, exported: boolean, content: ComponentGroup) {
    super(ctx, exported);
    this.#content = content;
  }

  copy() {
    return new SystemEntity(this.Location, this.Exported, this.#content.copy());
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

@AstItem
export class BuiltInFunction extends Component {
  readonly #name: string;
  readonly #parameters: ComponentGroup;
  readonly #returns: number;

  constructor(
    ctx: Location,
    name: string,
    parameters: ComponentGroup,
    returns: Type
  ) {
    super(ctx);
    this.#name = name;
    this.#parameters = parameters;
    this.#returns = returns.Index;
  }

  copy() {
    return new BuiltInFunction(
      this.Location,
      this.#name,
      this.#parameters.copy(),
      this.Returns.copy()
    );
  }

  get Name() {
    return this.#name;
  }

  get Returns() {
    return ComponentStore.Get(this.#returns);
  }

  get type_name() {
    return "external_function_declaration";
  }

  get extra_json() {
    return {
      name: this.#name,
      parameters: this.#parameters.json,
      returns: this.#returns,
    };
  }
}
