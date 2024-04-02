import { ComponentGroup } from "../ast/component-group";
import { Dto } from "./dtos";
import File from "./file";

export default class CFile extends File {
  readonly #dto: Dto.CFile;

  constructor(dto: Dto.CFile) {
    super();
    this.#dto = dto;
  }

  GetAst(): Promise<ComponentGroup> {
    throw new Error("Method not implemented.");
  }
}
