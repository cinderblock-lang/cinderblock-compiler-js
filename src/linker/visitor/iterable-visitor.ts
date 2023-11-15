import {
  Component,
  ComponentGroup,
  FunctionParameter,
  FunctionType,
  IterableType,
  Namespace,
  PrimitiveType,
  Property,
  ReferenceType,
  SchemaEntity,
  SchemaType,
  UseType,
  Visitor,
} from "#compiler/ast";
import { Namer, Location } from "#compiler/location";
import { LinkerError } from "../error";

const EmptyLocation = new Location("generated", -1, -1, -1, -1);

export class IterableVisitor extends Visitor {
  #data: Array<SchemaEntity> = [];

  get Namespace() {
    return new Namespace(
      EmptyLocation,
      false,
      "__Compiled__Code__",
      new ComponentGroup(...this.#data)
    );
  }
  get OperatesOn() {
    return [IterableType];
  }

  Visit(target: Component): {
    result: Component | undefined;
    cleanup: () => void;
  } {
    if (target instanceof IterableType) {
      const context_schema = new SchemaEntity(
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
              target.Type
            ),
            false
          ),
          new Property(
            target.Location,
            "done",
            new PrimitiveType(target.Location, "bool"),
            false
          ),
          new Property(target.Location, "result", target.Type, true)
        )
      );

      this.#data.push(context_schema);

      return {
        result: new ReferenceType(
          target.Location,
          context_schema.Name,
          context_schema
        ),
        cleanup: () => {},
      };
    }

    throw new LinkerError(target.Location, "No matching handler");
  }
}
