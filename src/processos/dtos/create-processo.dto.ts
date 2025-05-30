export class CreateProcessoDto {
  numero: string;
  ultimaMovimentacao: string;
  vara: string;
  requerente: string;
  requerido: string;
  dataDeposito?: Date;
  valorDeposito?: number;
  dataDevolucao?: Date;
  valorDevolvido?: number;
}
