/**
 * Horizontal list of tokenizer output chips.
 *
 */

interface TokenListProps {
  tokens: readonly string[];
}

export function TokenList({ tokens }: TokenListProps) {
  if (tokens.length === 0) {
    return <p className="page__placeholder">No tokens.</p>;
  }

  return (
    <ul className="token-list">
      {tokens.map((token, index) => (
        // Tokens can repeat; index is the only stable identity in the array.
        <li key={`${token}-${index}`}>
          <code>{token}</code>
        </li>
      ))}
    </ul>
  );
}
