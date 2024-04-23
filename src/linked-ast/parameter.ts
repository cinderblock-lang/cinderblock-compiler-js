import { CodeLocation } from "../location/code-location";
import { SubItem } from "./sub-item";
import { Type } from "./type/base";

export class Parameter extends SubItem {
  constructor(ctx: CodeLocation, name: string, type: Type, optional: boolean) {
    super(ctx, name, type, optional);
  }
}
