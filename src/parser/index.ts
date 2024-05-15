import { TokenGroup } from "./token-group";
import { SplitTokens } from "./tokeniser";

export function Tokenise(code: string, file_name: string) {
  const tokens = [...SplitTokens(code, file_name)];
  return new TokenGroup(tokens);
}
