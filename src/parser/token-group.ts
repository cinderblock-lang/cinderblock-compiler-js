import { ParserError } from "./error";
import { Token } from "./token";
import { TokenGroupResponse } from "./token-group-response";

export class TokenGroup {
  readonly #tokens: Array<Token>;
  readonly #index: number;

  constructor(tokens: Array<Token>, index = 0) {
    this.#tokens = tokens;
    this.#index = index;
  }

  get #value() {
    return this.#tokens[this.#index];
  }

  get CodeLocation() {
    return this.#value.CodeLocation;
  }

  get Text() {
    return this.#value.Text;
  }

  get Done() {
    return this.#index >= this.#tokens.length;
  }

  get Next() {
    return new TokenGroup(this.#tokens, this.#index + 1);
  }

  get Previous() {
    return new TokenGroup(this.#tokens, this.#index - 1);
  }

  Expect(...symbols: Array<string>) {
    if (!symbols.includes(this.Text))
      throw ParserError.UnexpectedSymbol(this, ...symbols);
  }

  Skip(count: number) {
    return new TokenGroup(this.#tokens, this.#index + count);
  }

  Build<TData extends Record<string, any>, TResponse>(
    actions: {
      [TKey in keyof TData]: (
        context: TokenGroup
      ) => TokenGroupResponse<TData[TKey]>;
    },
    builder: (
      data: TData,
      context: TokenGroup
    ) => TResponse | TokenGroupResponse<TResponse>
  ): TokenGroupResponse<TResponse> {
    let context: TokenGroup = this;
    const data: Partial<TData> = {};
    for (const key in actions) {
      const response = actions[key](context);
      context = response.Context;
      data[key] = response.Response;
    }

    const result = builder(data as TData, context);
    if (result instanceof TokenGroupResponse) return result;
    return new TokenGroupResponse(context, result);
  }

  Until<TResult>(
    mapper: (context: TokenGroup) => TokenGroupResponse<TResult>,
    ...look_for: Array<string>
  ) {
    let result: Array<TResult> = [];
    let token_group: TokenGroup = this;
    while (!look_for.includes(token_group.Text)) {
      const response = mapper(token_group);
      token_group = response.Context;
      result = [...result, response.Response];
    }

    return new TokenGroupResponse(token_group.Next, result);
  }

  UntilLookback<TResult>(
    mapper: (context: TokenGroup) => TokenGroupResponse<TResult>,
    ...look_for: Array<string>
  ) {
    let result: Array<TResult> = [];
    let token_group: TokenGroup = this;
    while (!look_for.includes(token_group.Previous.Text)) {
      const response = mapper(token_group);
      token_group = response.Context;
      result = [...result, response.Response];
    }

    return new TokenGroupResponse(token_group.Next, result);
  }
}
