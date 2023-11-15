import {
  AssignStatement,
  Component,
  ComponentGroup,
  ComponentStore,
  EmptyExpression,
  FunctionType,
  LambdaExpression,
  LiteralExpression,
  MakeExpression,
  Namespace,
  PanicStatement,
  PrimitiveType,
  Property,
  ReferenceType,
  StructEntity,
  Visitor,
} from "#compiler/ast";
import { PatternMatch, Location, Namer } from "#compiler/location";

const EmptyLocation = new Location("generated", -1, -1, -1, -1);

export class EmptyVisitor extends Visitor {
  #data: Array<StructEntity> = [];

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

  get OperatesOn(): (new (...args: any[]) => Component)[] {
    return [EmptyExpression];
  }

  Visit(target: Component) {
    return PatternMatch(EmptyExpression)((empty) => {
      const main_reference = new ReferenceType(
        target.Location,
        Namer.GetName()
      );

      const main = new StructEntity(
        target.Location,
        false,
        Namer.GetName(),
        new ComponentGroup(
          new Property(
            target.Location,
            "next",
            new FunctionType(
              target.Location,
              new ComponentGroup(),
              main_reference
            ),
            false
          ),
          new Property(
            target.Location,
            "done",
            new PrimitiveType(target.Location, "bool"),
            false
          ),
          new Property(
            target.Location,
            "result",
            new ReferenceType(target.Location, Namer.GetName(), empty.To),
            true
          )
        )
      );

      this.#data.push(main);

      ComponentStore.Replace(
        main_reference,
        new ReferenceType(target.Location, Namer.GetName(), main)
      );

      return {
        result: new MakeExpression(
          target.Location,
          main.Name,
          new ComponentGroup(
            new AssignStatement(
              target.Location,
              "done",
              new LiteralExpression(target.Location, "bool", "true")
            ),
            new AssignStatement(
              target.Location,
              "next",
              new LambdaExpression(
                target.Location,
                new ComponentGroup(),
                new ComponentGroup(
                  new PanicStatement(
                    target.Location,
                    new LiteralExpression(target.Location, "int", "1i")
                  )
                )
              )
            )
          ),
          main
        ),
        cleanup: () => {},
      };
    })(target);
  }
}
