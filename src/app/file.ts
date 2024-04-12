import { Namespace } from "../ast/namespace";

export default abstract class File {
  abstract GetAst(): Promise<Array<Namespace>>;
}
