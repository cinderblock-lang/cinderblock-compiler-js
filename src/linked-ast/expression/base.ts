import { LinkedComponent } from "../component";
import { LinkedType } from "../type/base";

export abstract class LinkedExpression extends LinkedComponent {
  abstract get Type(): LinkedType;
}
