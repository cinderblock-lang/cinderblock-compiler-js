import {
  DiscoverableTypeId,
  IConcreteType,
  IDiscoverableType,
  Scope,
} from "../../linker/closure";
import { LinkerError } from "../../linker/error";
import { CodeLocation } from "../../location/code-location";
import { WriterFile } from "../../writer/file";
import { WriterType } from "../../writer/type";
import { Type } from "./base";

export class UseType extends Type implements IDiscoverableType {
  readonly #name: string;
  readonly #constraints: Array<Type>;

  readonly [DiscoverableTypeId] = true;

  constructor(ctx: CodeLocation, name: string, constraints: Array<Type>) {
    super(ctx);
    this.#name = name;
    this.#constraints = constraints;
  }

  get Name() {
    return this.#name;
  }

  Build(file: WriterFile, scope: Scope): [WriterFile, WriterType] {
    throw new LinkerError(
      this.CodeLocation,
      "error",
      "Cannot resolve type of use statement"
    );
  }

  ResolveConcrete(scope: Scope): IConcreteType {
    throw new LinkerError(
      this.CodeLocation,
      "error",
      "Cannot resolve type of use statement"
    );
  }
}

Type.Register({
  Priority: 1,
  Is(token_group) {
    return token_group.Text === "use";
  },
  Extract(token_group) {
    const start = token_group.CodeLocation;
    token_group.Expect("use");

    let constraints: Array<Type> = [];
    while (token_group.Text !== "=") {
      token_group = token_group.Next;
      let result: Type;
      [token_group, result] = Type.Parse(token_group);
      token_group.Expect("=", "|");
      constraints = [...constraints, result];
    }

    const name = token_group.Next.Text;

    return [token_group.Skip(2), new UseType(start, name, constraints)];
  },
});
