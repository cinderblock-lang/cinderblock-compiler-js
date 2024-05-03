import { LinkerError } from "../linker/error";
import { WriterFunction } from "../writer/entity";
import { WriterFile } from "../writer/file";
import { WriterStatement } from "../writer/statement";
import { LinkedStatement } from "./statement/base";
import { LinkedReturnStatement } from "./statement/return";
import { LinkedSubStatement } from "./statement/sub";
import { LinkedType } from "./type/base";

export class LinkedBlock {
  readonly #components: Array<LinkedStatement>;

  constructor(components: Array<LinkedStatement>) {
    this.#components = components;
  }

  get Returns() {
    const target = this.#components.find(
      (c) => c instanceof LinkedReturnStatement
    );
    if (!target || !(target instanceof LinkedReturnStatement))
      throw new LinkerError(
        this.#components[0].CodeLocation,
        "error",
        "Unable to determine return type"
      );

    return target.Type;
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
