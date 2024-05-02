import { CodeBase } from "../ast/code-base";
import File from "./file";

export default class EmptyFile extends File {
  async GetAst(input: CodeBase): Promise<CodeBase> {
    return input;
  }
}
