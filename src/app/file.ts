import { CodeBase } from "../ast/code-base";

export default abstract class File {
  abstract GetAst(input: CodeBase): Promise<CodeBase>;
}
