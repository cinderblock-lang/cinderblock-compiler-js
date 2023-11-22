import {
  AccessExpression,
  Component,
  ComponentGroup,
  FunctionParameter,
  InvokationExpression,
  ReferenceExpression,
  SchemaEntity,
  SchemaType,
  StoreStatement,
  StructEntity,
  UseType,
} from "#compiler/ast";
import { ReferenceNameIndexingVisitor } from "./reference-name-indexing-visitor";
import { LinkerError } from "../error";
import {
  ResolveExpression,
  ResolveExpressionType,
  ResolveType,
} from "./resolve";
import { Namer } from "#compiler/location";

export class FunctionFlatteningVisitor extends ReferenceNameIndexingVisitor {
  get OperatesOn(): (new (...args: any[]) => Component)[] {
    return [...super.OperatesOn, InvokationExpression];
  }

  Visit(target: Component) {
    if (target instanceof InvokationExpression) {
      const subject = target.Subject;
      if (subject instanceof AccessExpression) {
        const accessing = ResolveExpression(subject.Subject);
        if (
          accessing instanceof StoreStatement ||
          accessing instanceof FunctionParameter
        ) {
          const type =
            accessing instanceof StoreStatement
              ? ResolveExpressionType(accessing.Equals)
              : accessing.Type;
          if (!type)
            throw new LinkerError(accessing.Location, "Could not find type");
          const accessing_type = ResolveType(type);
          if (
            ((accessing_type instanceof StructEntity ||
              accessing_type instanceof SchemaEntity ||
              accessing_type instanceof SchemaType) &&
              accessing_type.HasKey(subject.Target)) ||
            accessing_type instanceof UseType
          ) {
            return {
              result: undefined,
              cleanup: () => {},
            };
          }
        }

        const found = this.find(subject.Target);
        if (!found)
          throw new LinkerError(
            target.Location,
            `Reference not found ${subject.Target}`
          );
        return {
          result: new InvokationExpression(
            target.Location,
            new ReferenceExpression(found.Location, "", found),
            new ComponentGroup(
              new ReferenceExpression(
                accessing.Location,
                Namer.GetName(),
                accessing
              ),
              ...target.Parameters.iterator()
            )
          ),
          cleanup: () => {},
        };
      }

      return {
        result: undefined,
        cleanup: () => {},
      };
    }

    return super.Visit(target);
  }
}
