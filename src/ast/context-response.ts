import type { Context } from "./context";

export class ContextResponse<T> {
  readonly #context: Context;
  readonly #response: T;

  constructor(context: Context, response: T) {
    this.#context = context;
    this.#response = response;
  }

  get Context() {
    return this.#context;
  }

  get Response() {
    return this.#response;
  }
}
