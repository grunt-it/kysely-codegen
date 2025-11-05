import type { IdentifierStyle } from '../transformer/identifier-style';
import type { SymbolEntry } from '../transformer/symbol-collection';
import { SymbolCollection } from '../transformer/symbol-collection';
import { IdentifierNode } from './identifier-node';
import { LiteralNode } from './literal-node';

type RuntimeEnumMember = [key: string, value: LiteralNode];

export class RuntimeEnumDeclarationNode {
  readonly members: RuntimeEnumMember[];
  id: IdentifierNode;
  readonly type = 'RuntimeEnumDeclaration';

  constructor(
    name: string,
    literals: (string | number)[],
    options?: { identifierStyle?: IdentifierStyle },
  ) {
    this.members = [];
    this.id = new IdentifierNode(name);

    const symbolCollection = new SymbolCollection({
      entries: literals.map(
        (literal): SymbolEntry => [
          String(literal), // Convert to string for the identifier key
          { node: new LiteralNode(literal), type: 'RuntimeEnumMember' },
        ],
      ),
      identifierStyle: options?.identifierStyle,
    });

    for (const { id, symbol } of symbolCollection.entries()) {
      if (symbol.type !== 'RuntimeEnumMember') {
        continue;
      }

      this.members.push([id, symbol.node]);
    }
  }
}
