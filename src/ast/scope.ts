import { LinkedExpression } from "../linked-ast/expression/base";
import { LinkedMakeExpression } from "../linked-ast/expression/make";
import { LinkedAllocateStatement } from "../linked-ast/statement/allocate";
import { LinkedType } from "../linked-ast/type/base";
import { CodeLocation } from "../location/code-location";
import { FunctionEntity } from "./entity/function";

export class Scope {
  readonly #types: Record<string, LinkedType>;
  readonly #objects: Record<string, LinkedExpression>;
  readonly #make: LinkedAllocateStatement | undefined;

  constructor(
    types: Record<string, LinkedType>,
    objects: Record<string, LinkedExpression>,
    make: LinkedAllocateStatement | undefined
  ) {
    this.#types = types;
    this.#objects = objects;
    this.#make = make;
  }

  EnterFunction(func: FunctionEntity) {
    return new Scope({}, {}, undefined);
  }

  WithType(name: string, type: LinkedType) {
    return new Scope(
      {
        ...this.#types,
        [name]: type,
      },
      this.#objects,
      this.#make
    );
  }

  WithObject(name: string, value: LinkedExpression) {
    return new Scope(
      this.#types,
      {
        ...this.#objects,
        [name]: value,
      },
      this.#make
    );
  }

  WithMake(make: LinkedAllocateStatement) {
    return new Scope(this.#types, this.#objects, make);
  }

  GetObject(name: string) {
    return this.#objects[name];
  }

  GetType(name: string) {
    return this.#types[name];
  }

  GetMake() {
    return this.#make;
  }
}
