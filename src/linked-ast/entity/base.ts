import { LinkedComponent } from "../component";
import { LinkedType } from "../type/base";

export abstract class LinkedEntity extends LinkedComponent {
  abstract get Type(): LinkedType;
}
