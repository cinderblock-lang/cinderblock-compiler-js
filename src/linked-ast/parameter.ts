import { CodeLocation } from "../location/code-location";
import { SubItem } from "./sub-item";
import { LinkedType } from "./type/base";

export class Parameter extends SubItem {
  constructor(ctx: CodeLocation, name: string, type: LinkedType, optional: boolean) {
    super(ctx, name, type, optional);
  }
}
