import { Component } from "../ast/component";

export interface IClosure {
  Resolve(name: string): Component | undefined;
}
