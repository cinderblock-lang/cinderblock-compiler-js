import { ParserError } from "./error";
import { TokenGroup } from "./token";

export function NextBlock(tokens: TokenGroup) {
  const first = tokens.next();
  if (first.done) throw ParserError.EndOfFile;

  return first.value;
}

export function ExpectNext(tokens: TokenGroup, ...expected: Array<string>) {
  const item = NextBlock(tokens);
  if (!expected.includes(item.Text))
    throw ParserError.UnexpectedSymbol(item, ...expected);

  return item;
}

export function BuildWhilePeek<T>(
  tokens: TokenGroup,
  to_next: (value: string) => boolean,
  handler: () => T
) {
  const result = [];
  while (to_next(tokens.peek()?.Text ?? "")) {
    result.push(handler());
  }

  return result;
}

export function BuildWhile<T>(
  tokens: TokenGroup,
  expect_start: string | undefined,
  to_next: string,
  end: string,
  handler: () => T
) {
  const result = [];
  let next = expect_start
    ? ExpectNext(tokens, expect_start)
    : NextBlock(tokens);
  while (next.Text === to_next || next.Text === expect_start) {
    if (tokens.peek()?.Text === end) {
      next = NextBlock(tokens);
      break;
    }

    result.push(handler());
    next = NextBlock(tokens);
  }

  if (next.Text !== end) throw ParserError.UnexpectedSymbol(next, end, to_next);
  return result;
}

export function BuildWhileOnStart<T>(
  tokens: TokenGroup,
  to_next: string,
  end: string,
  handler: () => T
) {
  const result = [handler()];
  let next = NextBlock(tokens);
  while (next.Text === to_next) {
    result.push(handler());
    next = NextBlock(tokens);
  }

  if (next.Text !== end) throw ParserError.UnexpectedSymbol(next, end, to_next);
  return result;
}

export function IfIs<T>(
  tokens: TokenGroup,
  expected: string,
  handler: () => T
) {
  if (tokens.peek()?.Text === expected) {
    NextBlock(tokens);
    return handler();
  }
  return undefined;
}
