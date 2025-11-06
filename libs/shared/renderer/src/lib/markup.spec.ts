import { buildParsedMessageContent, createStreamingMarkupBuilder, encodeBase64Json, encodeBase64Text } from './markup.js';

describe('markup renderer', () => {
  it('builds parsed content with custom elements for tables and quotes', () => {
    const markdown = `Table: Weekly Status\n\n| Task | Status |\n| --- | --- |\n| Build | Complete |\n\n> Remember to review`;

    const parsed = buildParsedMessageContent(markdown);

    expect(parsed.blocks).toMatchObject([
      { type: 'table', presentation: 'citation', caption: 'Weekly Status' },
      { type: 'quote', text: 'Remember to review' },
    ]);

    expect(parsed.elements).toHaveLength(2);

    const [tableElement, quoteElement] = parsed.elements;

    expect(tableElement.tag).toBe('app-table-catation');
    expect(tableElement.attributes?.data).toBe(encodeBase64Json({
      headers: ['Task', 'Status'],
      rows: [['Build', 'Complete']],
    }));

    expect(quoteElement.tag).toBe('app-catation');
    expect(quoteElement.attributes?.text).toBe(encodeBase64Text('Remember to review'));
  });

  it('accumulates streaming chunks into parsed content', () => {
    const builder = createStreamingMarkupBuilder();

    builder.reset();
    builder.append({ token: 'Hello ' });
    const mid = builder.append({ token: 'world' });

    expect(mid.plainText).toBe('Hello world');

    const final = builder.append({ cumulativeContent: 'Hello world\n\n> Quote' });

    expect(final.blocks[1]).toMatchObject({ type: 'quote', text: 'Quote' });
    expect(final.elements).toHaveLength(1);
  });
});

