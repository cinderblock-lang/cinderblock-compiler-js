import { Ast } from "../ast/code-base";
import { Tokenise } from "../parser";
import { Dto } from "./dtos";
import File from "./file";
import Fs from "fs/promises";

export default class CinderblockFile extends File {
  readonly #dto: Dto.CinderBlockFile;

  constructor(dto: Dto.CinderBlockFile) {
    super();
    this.#dto = dto;
  }

  async GetAst(input: Ast): Promise<Ast> {
    const code = await Fs.readFile(this.#dto, "utf-8");
    const tokens = Tokenise(code, this.#dto);
    return input.With(tokens);
  }
}
