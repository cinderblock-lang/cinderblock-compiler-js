import { Component } from "../component";
import { Type } from "../type/base";

export abstract class Entity extends Component {
  abstract get Type(): Type;
}
