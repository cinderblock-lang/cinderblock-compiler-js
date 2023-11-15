import {
  AccessExpression,
  Component,
  ComponentGroup,
  FunctionParameter,
  InvokationExpression,
  IterableType,
  LambdaExpression,
  ReduceExpression,
  ReferenceExpression,
  Visitor,
} from "#compiler/ast";
import { PatternMatch } from "#compiler/location";
import { ResolveExpression } from "./resolve";

export class ReduceVisitor extends Visitor {
  constructor() {
    super();
  }

  get OperatesOn(): (new (...args: any[]) => Component)[] {
    return [ReduceExpression];
  }

  Visit(target: Component) {
    return PatternMatch(ReduceExpression)((reduce) => {
      const target = ResolveExpression(reduce.Over);
      const creating = ResolveExpression(reduce.With);

      if (!(target instanceof IterableType))
        return { result: undefined, cleanup: () => {} };
      return {
        result: new InvokationExpression(
          reduce.Location,
          new AccessExpression(
            target.Location,
            new AccessExpression(
              target.Location,
              new ReferenceExpression(target.Location, "std"),
              "iterable"
            ),
            "Reduce"
          ),
          new ComponentGroup(
            reduce.Over,
            reduce.With,
            new LambdaExpression(
              reduce.Location,
              new ComponentGroup(
                new FunctionParameter(
                  reduce.Location,
                  reduce.As,
                  target,
                  false
                ),
                new FunctionParameter(
                  reduce.Location,
                  reduce.WithAs,
                  creating,
                  false
                )
              ),
              reduce.Body
            )
          )
        ),
        cleanup: () => {},
      };
    })(target);
  }
}
