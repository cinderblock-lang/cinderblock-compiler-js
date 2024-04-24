import { WriterFunction } from "../writer/entity";
import { WriterFile } from "../writer/file";
import { WriterStatement } from "../writer/statement";
import { LinkedStatement } from "./statement/base";
import { LinkedSubStatement } from "./statement/sub";
import { LinkedType } from "./type/base";

export class LinkedBlock {
  readonly #components: Array<LinkedStatement>;
  readonly #returns: LinkedType;

  constructor(components: Array<LinkedStatement>, returns: LinkedType) {
    this.#components = components;
    this.#returns = returns;
  }

  get Returns() {
    return this.#returns;
  }

  Build(
    file: WriterFile,
    func: WriterFunction
  ): [WriterFile, WriterFunction, Array<WriterStatement>] {
    let result: Array<WriterStatement> = [];
    for (const component of this.#components) {
      if (component instanceof LinkedSubStatement) continue;
      let output: WriterStatement;
      [file, func, output] = component.Build(file, func);
      result = [...result, output];
    }

    return [file, func, result];
  }
}
