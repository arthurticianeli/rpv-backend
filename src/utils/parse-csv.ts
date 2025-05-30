import { parse } from 'csv-parse/sync';
import { CreateProcessoDto } from 'src/processos/dtos/create-processo.dto';

export function parseCSV(csv: string): CreateProcessoDto[] {
  const records = parse(csv, {
    columns: true,
    skip_empty_lines: true,
    delimiter: ',',
  }) as Record<string, string>[];

  return records.map((r: Record<string, string>) => ({
    numero: r['Número do processo'],
    ultimaMovimentacao: r['Última mov.'],
    vara: r['Vara'],
    requerente: r['Requerente'],
    requerido: r['Requerido'],
    dataDeposito: parseDate(r['Data depósito']),
    valorDeposito: parseFloat(toNumber(r['Valor depósito'])),
    dataDevolucao: parseDate(r['Data devolução']),
    valorDevolvido: parseFloat(toNumber(r['Valor devolvido'])),
  }));
}

function parseDate(date: string): Date | undefined {
  if (!date) return undefined;
  const [d, m, y] = date.split('/');
  return new Date(`${y}-${m}-${d}`);
}

function toNumber(str: string) {
  if (!str) return '0';
  return str.replace(/\./g, '').replace(',', '.');
}
