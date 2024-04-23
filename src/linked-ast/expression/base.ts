import { Component } from "../component";
import { Type } from "../type/base";

export abstract class Expression extends Component {
  abstract get Type(): Type;
}
