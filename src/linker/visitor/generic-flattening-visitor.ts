import {
  Component,
  ComponentGroup,
  ComponentStore,
  Expression,
  FunctionEntity,
  FunctionParameter,
  InvokationExpression,
  IsExpression,
  LiteralExpression,
  Namespace,
  Property,
  ReferenceExpression,
  ReferenceType,
  SchemaEntity,
  SchemaType,
  StructEntity,
  UseType,
  Visitor,
} from "#compiler/ast";
import { PatternMatch, Location, Namer } from "#compiler/location";
import { RequireType } from "../../location/pattern-match";
import { LinkerError } from "../error";
import { ResolveExpression } from "./resolve";

const EmptyLocation = new Location("generated", -1, -1, -1, -1);

class TypeSwappingVisitor extends Visitor {
  readonly #swapping: Array<[Component, Component]>;

  constructor(swapping: Array<[Component, Component]>) {
    super();
    this.#swapping = swapping;
  }

  get OperatesOn() {
    return [ReferenceType, SchemaType, IsExpression];
  }

  Visit(target: Component) {
    return PatternMatch(ReferenceType, SchemaType, IsExpression)(
      (
        reference
      ): {
        result: Component | undefined;
        cleanup: () => void;
      } => {
        const target = reference.References;
        if (!target)
          throw new LinkerError(reference.Location, "Unresolved reference");

        for (const [current, desired] of this.#swapping)
          if (target.Index === current.Index)
            return {
              result: new ReferenceExpression(
                reference.Location,
                reference.Name,
                desired
              ),
              cleanup: () => {},
            };

        return { result: undefined, cleanup: () => {} };
      },
      (schema) => {
        for (const [current, desired] of this.#swapping)
          if (schema.Index === current.Index)
            return {
              result: new ReferenceExpression(
                schema.Location,
                Namer.GetName(),
                desired
              ),
              cleanup: () => {},
            };
        return { result: undefined, cleanup: () => {} };
      },
      (is) => {
        const subject = ResolveExpression(is.Left);

        if (subject.Index === is.Right.Index)
          return {
            result: new LiteralExpression(is.Location, "bool", "true"),
            cleanup: () => {},
          };

        return {
          result: new LiteralExpression(is.Location, "bool", "false"),
          cleanup: () => {},
        };
      }
    )(target);
  }
}

export class GenericFlatteningVisitor extends Visitor {
  #data: Array<FunctionEntity> = [];
  #skipping = false;
  #found = false;

  get Namespace() {
    return new Namespace(
      EmptyLocation,
      false,
      "__Compiled__Code__",
      new ComponentGroup(...this.#data)
    );
  }

  constructor() {
    super();
  }

  #process_type(
    current: Component,
    invoking_with: Component
  ): { generic: boolean; uses: Array<[Component, Component]> } {
    if (current instanceof SchemaEntity)
      return { generic: true, uses: [[current, invoking_with]] };
    if (current instanceof SchemaType) {
      let uses: Array<[Component, Component]> = [[current, invoking_with]];

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

        const { uses: additional } = this.#process_type(type, actual.Type);
        uses.push(...additional);
      }

      return { generic: true, uses };
    }

    if (current instanceof UseType) {
      return { generic: true, uses: [[current, invoking_with]] };
    }

    return { generic: false, uses: [] };
  }

  #is_generic(invokation: InvokationExpression, invoking: FunctionEntity) {
    const desired = [...invoking.Parameters.iterator()];
    const current = [...invokation.Parameters.iterator()];

    let generic = false;
    const using: Array<[Component, Component]> = [];
    const remove: Array<FunctionParameter> = [];
    for (let i = 0; i < desired.length; i++) {
      const c = desired[i];
      const u = current[i];

      RequireType(FunctionParameter, c);
      if (c.Optional) {
        if (!u) remove.push(c);
        generic = true;
        continue;
      }

      RequireType(Expression, u);

      const type = c.Type;
      if (!type) throw new LinkerError(c.Location, "Parameter has no type");
      const result = this.#process_type(c.Type, ResolveExpression(u));

      generic = generic || result.generic;
      using.push(...(result.uses ?? []));
    }

    return { generic, using };
  }

  get OperatesOn(): (new (...args: any[]) => Component)[] {
    return [InvokationExpression, FunctionEntity];
  }

  Reset() {
    this.#found = false;
  }

  get FoundAny() {
    return this.#found;
  }

  Visit(target: Component) {
    return PatternMatch(InvokationExpression, FunctionEntity)(
      (invokation) => {
        if (this.#skipping)
          return {
            result: undefined,
            cleanup: () => {},
          };
        const invoking = ResolveExpression(invokation.Subject);
        RequireType(FunctionEntity, invoking);

        const { generic, using } = this.#is_generic(invokation, invoking);
        if (!generic) return { result: undefined, cleanup: () => {} };
        this.#found = true;

        const copied = invoking.copy();

        ComponentStore.Visit(copied, new TypeSwappingVisitor(using));

        this.#data.push(copied);

        return {
          result: new InvokationExpression(
            invokation.Location,
            new ReferenceExpression(invokation.Location, copied.Name, copied),
            invokation.Parameters
          ),
          cleanup: () => {},
        };
      },
      (func) => {
        const desired = [...func.Parameters.iterator()];

        const is_generic = () => {
          this.#skipping = true;

          return {
            result: undefined,
            cleanup: () => {
              this.#skipping = false;
            },
          };
        };

        for (let i = 0; i < desired.length; i++) {
          const c = desired[i];

          RequireType(FunctionParameter, c);
          if (c.Optional) return is_generic();

          const type = c.Type;
          if (!type) throw new LinkerError(c.Location, "Parameter has no type");

          if (type instanceof SchemaType) return is_generic();
          if (type instanceof SchemaEntity) return is_generic();
          if (type instanceof UseType) return is_generic();
        }

        return {
          result: undefined,
          cleanup: () => {},
        };
      }
    )(target);
  }
}
