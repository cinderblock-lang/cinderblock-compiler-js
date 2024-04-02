import { ComponentGroup } from "../ast/component-group";
import { ParseCinderblock } from "../parser";
import { Dto } from "./dtos";
import File from "./file";
import Fs from "fs/promises";

export default class CinderblockFile extends File {
  readonly #dto: Dto.CinderBlockFile;

  constructor(dto: Dto.CinderBlockFile) {
    super();
    this.#dto = dto;
  }

  async GetAst(): Promise<ComponentGroup> {
    const code = await Fs.readFile(this.#dto, "utf-8");
    return ParseCinderblock(code, this.#dto);
  }
}
