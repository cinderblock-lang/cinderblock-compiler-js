import { Component, ComponentGroup, WriterContext } from "./base";
import { FunctionParameter, Property } from "./property";
import {
  FunctionType,
  PrimitiveType,
  ReferenceType,
  SchemaType,
  Type,
  UseType,
} from "./type";
import { Location, Namer } from "#compiler/location";
import { Expression } from "./expression";
import {
  ResolveBlockType,
  ResolveExpressionType,
  ResolveType,
} from "../linker/resolve";
import { RequireOneOfType, RequireType } from "../location/pattern-match";
import { LinkerError } from "../linker/error";
import { RawStatement, ReturnStatement, StoreStatement } from ".";
import { Unique } from "./utils";

const already_made: Array<string> = [];

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
  readonly #namespace: string;
  readonly #using: Array<string>;

  constructor(
    ctx: Location,
    exported: boolean,
    name: string,
    parameters: ComponentGroup,
    content: ComponentGroup,
    returns: Component | undefined,
    namespace: string,
    using: Array<string>
  ) {
    super(ctx, exported);
    this.#name = name;
    this.#parameters = parameters;
    this.#content = content;
    this.#returns = returns;
    this.#namespace = namespace;
    this.#using = using;
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

  get #full_name() {
    return this.#namespace.replace(/\./gm, "__") + "__" + this.Name;
  }

  #process_type(
    current: Component | undefined,
    invoking_with: Component,
    ctx: WriterContext
  ): { target: Type; uses: Record<string, Type> } {
    if (!current) return { target: invoking_with, uses: {} };
    if (current instanceof ReferenceType) current = ResolveType(current, ctx);
    if (current instanceof SchemaType || current instanceof SchemaEntity) {
      let uses: Record<string, Type> = {};

      RequireType(StructEntity, invoking_with);

      for (const property of current.Properties.iterator()) {
        RequireType(Property, property);
        const type = property.Type;

        const actual = invoking_with.GetKey(property.Name);
        if (!actual)
          throw new LinkerError(
            property.Location,
            "Cannot find matching property"
          );

        const { uses: additional } = this.#process_type(type, actual.Type, ctx);
        uses = { ...uses, ...additional };
      }

      return { target: invoking_with, uses };
    }

    if (current instanceof UseType) {
      return { target: invoking_with, uses: { [current.Name]: invoking_with } };
    }

    return { target: current, uses: {} };
  }

  #build_invokation_parameters(old_ctx: WriterContext) {
    const ctx: WriterContext = {
      ...old_ctx,
      parameters: {
        ctx: new PrimitiveType(this.Location, "null"),
      },
      use_types: {},
      locals: {},
      namespace: this.#namespace,
      using: this.#using,
    };
    const invokation = ctx.invokation;
    const expected = [...this.Parameters.iterator()];
    const actual = [...(invokation?.Parameters.iterator() ?? [])];
    const input: Array<FunctionParameter> = [
      new FunctionParameter(
        this.Location,
        "ctx",
        new PrimitiveType(this.Location, "null"),
        false
      ),
    ];

    for (let i = 0; i < expected.length; i++) {
      const e = expected[i];
      RequireType(FunctionParameter, e);
      const a = actual[i];

      if (!a) {
        input.push(e);
        if (!e.Type)
          throw new LinkerError(
            e.Location,
            "Cannot resolve function parameter type in this location"
          );

        ctx.parameters[e.Name] = e;
        continue;
      }

      const { target, uses: updated } = this.#process_type(
        e.Type,
        ResolveExpressionType(a, old_ctx),
        ctx
      );
      ctx.use_types = { ...ctx.use_types, ...updated };

      const param = new FunctionParameter(
        e.Location,
        e.Name,
        target,
        e.Optional
      );
      input.push(param);
      ctx.parameters[e.Name] = param;
    }

    for (const statement of this.Content.iterator()) {
      if (statement instanceof StoreStatement) {
        ctx.locals[statement.Name] = statement;
      }

      if (statement instanceof RawStatement) {
        ctx.locals[statement.Reference] = statement;
      }
    }

    return {
      input_parameters: input,
      returns: ResolveBlockType(this.Content, ctx),
      ctx,
    };
  }

  invoked(ctx_old: WriterContext) {
    ctx_old = { ...ctx_old, namespace: this.#namespace, using: this.#using };
    const { input_parameters, returns, ctx } =
      this.#build_invokation_parameters(ctx_old);

    return new FunctionEntity(
      this.Location,
      this.Exported,
      this.Name,
      new ComponentGroup(...input_parameters),
      this.Content,
      returns,
      ctx.namespace,
      ctx.using
    );
  }

  c(ctx_old: WriterContext): string {
    const { input_parameters, returns, ctx } =
      this.#build_invokation_parameters(ctx_old);

    const prefix: Array<string> = [];
    const suffix: Array<string> = [];

    const body = this.Content.find(ReturnStatement).c({
      ...ctx,
      prefix,
      suffix,
    });
    RequireType(Type, returns);
    if (this.Name === "main" && ctx.namespace === "App") {
      return `${returns.c(ctx)} ${this.Name}(${input_parameters
        .map((p) => {
          RequireType(FunctionParameter, p);
          const type = p.Type;
          if (!type)
            throw new LinkerError(p.Location, "Could not resolve type");

          RequireType(Type, type);
          return `${type.c(ctx)} ${p.Name}`;
        })
        .join(", ")}) {
        ${prefix.join("\n")}
        ${suffix.join("\n")}
        return ${body};
      }`;
    }

    if (!already_made.includes(this.#full_name)) {
      already_made.push(this.#full_name);
      ctx.file.add_global(`${returns.c(ctx)} ${
        this.#full_name
      }(${input_parameters
        .map((p) => {
          RequireType(FunctionParameter, p);
          const type = p.Type;
          if (!type)
            throw new LinkerError(p.Location, "Could not resolve type");

          RequireOneOfType([Type, StructEntity], type);
          return `${type.c(ctx)} ${p.Name}`;
        })
        .join(", ")}) {
          ${prefix.filter(Unique).join("\n")}
          ${suffix.filter(Unique).join("\n")}
          return ${body};
      }`);
    }

    const struct = new FunctionType(
      this.Location,
      new ComponentGroup(...input_parameters),
      returns
    ).c({ ...ctx });

    const instance_name = Namer.GetName();
    ctx.prefix.push(
      `${struct} ${instance_name} = { &${this.#full_name}, NULL };`
    );

    return instance_name;
  }
}

export class StructEntity extends Entity {
  readonly #name: string;
  readonly #properties: ComponentGroup;
  readonly #namespace: string;
  readonly #using: Array<string>;

  constructor(
    ctx: Location,
    exported: boolean,
    name: string,
    properties: ComponentGroup,
    namespace: string,
    using: Array<string>
  ) {
    super(ctx, exported);
    this.#name = name;
    this.#properties = properties;
    this.#namespace = namespace;
    this.#using = using;
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

  get #full_name() {
    return this.#namespace.replace(/\./gm, "__") + "__" + this.Name;
  }

  c(ctx: WriterContext): string {
    if (!already_made.includes(this.#full_name)) {
      already_made.push(this.#full_name);
      ctx.file.add_global(`typedef struct ${this.#full_name} {
        ${this.Properties.map((p) =>
          p.c({ ...ctx, namespace: this.#namespace, using: this.#using })
        )}
      } ${this.#full_name};`);
    }

    return this.#full_name;
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

  IsCompatible(subject: StructEntity): boolean {
    throw new Error("Not yet implemented");
  }

  get type_name() {
    return "schema_entity";
  }

  c(ctx: WriterContext): string {
    return ``;
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

  c(ctx: WriterContext): string {
    ctx.using.push(this.Name);

    return ``;
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

  c(ctx: WriterContext): string {
    console.warn(
      "Currently, external functions are not supported and will be ignored"
    );
    return ``;
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

  c(ctx: WriterContext): string {
    console.warn(
      "Currently, external functions are not supported and will be ignored"
    );
    return ``;
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

  c(ctx: WriterContext): string {
    console.warn(
      "Currently, external functions are not supported and will be ignored"
    );
    return ``;
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

  c(ctx: WriterContext): string {
    const name = Namer.GetName();

    const params = new ComponentGroup(
      new FunctionParameter(
        this.Location,
        "ctx",
        new PrimitiveType(this.Location, "null"),
        false
      ),
      ...this.Parameters.iterator()
    );

    if (!already_made.includes(this.Name)) {
      already_made.push(this.Name);

      for (const requirement of this.Requires)
        ctx.file.add_include(requirement);
      ctx.file.add_global(`${this.Returns.c(ctx)} ${this.Name}(${params
        .map((p) => {
          RequireType(FunctionParameter, p);
          const type = p.Type;
          if (!type)
            throw new LinkerError(p.Location, "Could not resolve type");

          RequireType(Type, type);
          return `${type.c(ctx)} ${p.Name}`;
        })
        .join(", ")}) {
        ${this.Source}
      }`);
    }

    const struct = new FunctionType(this.Location, params, this.Returns).c({
      ...ctx,
    });

    ctx.prefix.push(`${struct} ${name} = { &${this.Name}, NULL };`);

    return name;
  }
}
