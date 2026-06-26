import { describe, expect, it } from 'vitest';
import { buildProtocolHtml } from '../utils/reportExporter.js';
import { buildProtocol } from '../engines/protocolEngine.js';

describe('reportExporter.buildProtocolHtml', () => {
  it('inclui dose, fonte e o disclaimer padrao na ficha', () => {
    const protocol = buildProtocol({ organismo: 'bacillus', cultura: 'soja' });
    const html = buildProtocolHtml(protocol, { cultura: 'soja' });
    expect(html).toContain('Esporos');
    expect(html).toContain('RizoWiki 1.0');
    expect(html.toLowerCase()).toContain('apoio a decisao');
  });

  it('lida com protocolo vazio sem quebrar', () => {
    const html = buildProtocolHtml(null);
    expect(html).toContain('Sem protocolo');
  });
});
