import {
  BuiltInFunction,
  Component,
  ComponentGroup,
  ComponentStore,
  Expression,
  ExternalFunctionDeclaration,
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
  StoreStatement,
  StructEntity,
  UseType,
  Visitor,
} from "#compiler/ast";
import { PatternMatch, Location, Namer } from "#compiler/location";
import { RequireType } from "../../location/pattern-match";
import { LinkerError } from "../error";
import {
  ResolveExpression,
  ResolveExpressionType,
  ResolveType,
} from "./resolve";

const EmptyLocation = new Location("generated", -1, -1, -1, -1);

class TypeSwappingVisitor extends Visitor {
  readonly #swapping: Array<[Component, Component]>;

  constructor(swapping: Array<[Component, Component]>) {
    super();
    this.#swapping = swapping;
  }

  get OperatesOn() {
    return [ReferenceType, SchemaType, IsExpression, UseType];
  }

  Visit(target: Component) {
    return PatternMatch(ReferenceType, SchemaType, IsExpression, UseType)(
      (
        reference
      ): {
        result: Component | undefined;
        cleanup: () => void;
      } => {
        const target = reference.References;
        if (!target)
          throw new LinkerError(reference.Location, "Unresolved reference");

        for (const [current, desired] of this.#swapping) {
          if (target.Index === current.Index) {
            return {
              result: new ReferenceType(
                reference.Location,
                reference.Name,
                desired
              ),
              cleanup: () => {},
            };
          }
        }

        return { result: undefined, cleanup: () => {} };
      },
      (schema) => {
        for (const [current, desired] of this.#swapping) {
          if (schema.Index === current.Index)
            return {
              result: new ReferenceType(
                schema.Location,
                Namer.GetName(),
                desired
              ),
              cleanup: () => {},
            };
        }
        return { result: undefined, cleanup: () => {} };
      },
      (is) => {
        const subject = ResolveExpressionType(is.Left);

        if (subject.Index === is.Right.Index)
          return {
            result: new LiteralExpression(is.Location, "bool", "true"),
            cleanup: () => {},
          };

        return {
          result: new LiteralExpression(is.Location, "bool", "false"),
          cleanup: () => {},
        };
      },
      (use) => {
        const swapping = this.#swapping;
        for (const [current, desired] of swapping) {
          if (use.Index === current.Index) {
            if (current.Index !== desired.Index)
              return {
                result: new ReferenceType(
                  use.Location,
                  Namer.GetName(),
                  desired
                ),
                cleanup: () => {},
              };
          }
        }

        return {
          result: undefined,
          cleanup: () => {},
        };
      }
    )(target);
  }
}

export class GenericFlatteningVisitor extends Visitor {
  #data: Array<FunctionEntity> = [];
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
    if (current instanceof ReferenceType) current = ResolveType(current);
    if (current instanceof SchemaType || current instanceof SchemaEntity) {
      let uses: Array<[Component, Component]> = [[current, invoking_with]];

      if (invoking_with instanceof UseType) return { generic: true, uses };

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
      let u = current[i];

      RequireType(FunctionParameter, c);
      if (c.Optional) {
        if (!u) remove.push(c);
        generic = true;
        continue;
      }

      if (u instanceof StoreStatement) u = u.Equals;

      RequireType(Expression, u);

      const type = c.Type;
      if (!type) throw new LinkerError(c.Location, "Parameter has no type");
      const result = this.#process_type(c.Type, ResolveExpressionType(u));

      generic = generic || result.generic;
      using.push(...(result.uses ?? []));
    }

    return { generic, using };
  }

  get OperatesOn(): (new (...args: any[]) => Component)[] {
    return [InvokationExpression];
  }

  Reset() {
    this.#found = false;
  }

  get FoundAny() {
    return this.#found;
  }

  Visit(target: Component) {
    return PatternMatch(InvokationExpression)((invokation) => {
      const invoking = ResolveExpression(invokation.Subject);
      if (
        invoking instanceof ExternalFunctionDeclaration ||
        invoking instanceof BuiltInFunction
      )
        return {
          result: undefined,
          cleanup: () => {},
        };
      if (!(invoking instanceof FunctionEntity))
        return { result: undefined, cleanup: () => {} };

      const { generic, using } = this.#is_generic(invokation, invoking);
      if (!generic)
        return {
          result: undefined,
          cleanup: () => {},
        };

      if (!generic) return { result: undefined, cleanup: () => {} };
      this.#found = true;

      const copied = invoking.copy();

      ComponentStore.DeepVisit(copied, new TypeSwappingVisitor(using));

      this.#data.push(copied);

      return {
        result: new InvokationExpression(
          invokation.Location,
          new ReferenceExpression(invokation.Location, copied.Name, copied),
          invokation.Parameters
        ),
        cleanup: () => {},
      };
    })(target);
  }
}
