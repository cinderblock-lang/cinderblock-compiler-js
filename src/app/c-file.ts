import { ComponentGroup } from "../ast/component-group";
import { ExternalFunctionEntity } from "../ast/entity/external-function";
import { FunctionParameter } from "../ast/function-parameter";
import { Namespace } from "../ast/namespace";
import { PrimitiveName, PrimitiveType } from "../ast/type/primitive";
import { EmptyCodeLocation } from "../location/empty";
import { ExtractType } from "../parser/extractors/type";
import { Dto } from "./dtos";
import File from "./file";
import Fs from "fs/promises";

export default class CFile extends File {
  readonly #dto: Dto.CFile;

  constructor(dto: Dto.CFile) {
    super();
    this.#dto = dto;
  }

  async GetAst(): Promise<ComponentGroup> {
    const text = await Fs.readFile(this.#dto.path, "utf-8");
    return new ComponentGroup(
      new Namespace(
        EmptyCodeLocation,
        false,
        this.#dto.namespace,
        new ComponentGroup(
          ...Object.keys(this.#dto.functions)
            .map((f) => [f, this.#dto.functions[f]] as const)
            .map(
              ([name, detail]) =>
                new ExternalFunctionEntity(
                  EmptyCodeLocation,
                  name,
                  new ComponentGroup(
                    ...detail.args.map(
                      (a) =>
                        new FunctionParameter(
                          EmptyCodeLocation,
                          a,
                          new PrimitiveType(EmptyCodeLocation, a),
                          false
                        )
                    )
                  ),
                  detail.c_name,
                  text,
                  this.#dto.path,
                  new PrimitiveType(EmptyCodeLocation, detail.returns),
                  this.#dto.namespace
                )
            )
        )
      )
    );
  }
}
