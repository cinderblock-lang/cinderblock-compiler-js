import { CodeBase } from "../ast/code-base";
import { Tokenise } from "../parser";
import { Dto } from "./dtos";
import File from "./file";
import Fs from "fs/promises";

export default class CinderblockFile extends File {
  readonly #dto: Dto.CinderBlockFile;
  readonly #display_name: string;

  constructor(dto: Dto.CinderBlockFile, display_name: string) {
    super();
    this.#dto = dto;
    this.#display_name = display_name;
  }

  async GetAst(input: CodeBase): Promise<CodeBase> {
    const code = await Fs.readFile(this.#dto, "utf-8");
    const tokens = Tokenise(code, this.#display_name);
    return input.With(tokens);
  }
}
