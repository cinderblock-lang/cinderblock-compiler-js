import {
  AccessExpression,
  Component,
  ComponentGroup,
  InvokationExpression,
  ReferenceExpression,
  StructEntity,
} from "#compiler/ast";
import { ReferenceNameIndexingVisitor } from "./reference-name-indexing-visitor";
import { LinkerError } from "../error";

export class FunctionFlatteningVisitor extends ReferenceNameIndexingVisitor {
  get OperatesOn(): (new (...args: any[]) => Component)[] {
    return [...super.OperatesOn, InvokationExpression];
  }

  Visit(target: Component) {
    if (target instanceof InvokationExpression) {
      const subject = target.Subject;
      if (subject instanceof AccessExpression) {
        const accessing = subject.Subject;
        if (
          accessing instanceof ReferenceExpression &&
          accessing.References instanceof StructEntity &&
          accessing.References.HasKey(accessing.Name)
        ) {
          return {
            result: undefined,
            cleanup: () => {},
          };
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
            new ComponentGroup(accessing, ...target.Parameters.iterator())
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
