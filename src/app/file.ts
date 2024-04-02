import { ComponentGroup } from "../ast/component-group";
import { Dto } from "./dtos";

export default abstract class File {
  abstract GetAst(): Promise<ComponentGroup>;
}
