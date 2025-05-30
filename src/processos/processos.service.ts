/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProcessoDto } from './dtos/create-processo.dto';
import { UpdateProcessoDto } from './dtos/update-processo.dto';
import { Response } from 'express';
import * as PDFDocument from 'pdfkit';
import { Document, Packer, Paragraph, TextRun, AlignmentType } from 'docx';

@Injectable()
export class ProcessosService {
  constructor(private readonly prisma: PrismaService) { }

  async create(data: CreateProcessoDto) {
    return this.prisma.processo.create({ data });
  }

  async findAll() {
    return this.prisma.processo.findMany();
  }

  async findOne(numero: string) {
    return this.prisma.processo.findUnique({ where: { numero } });
  }

  async update(numero: string, data: UpdateProcessoDto) {
    if (!data || Object.keys(data).length === 0) {
      throw new Error('Argumento "data" é obrigatório e não pode ser vazio.');
    }
    return this.prisma.processo.update({ where: { numero }, data });
  }

  async remove(numero: string) {
    return this.prisma.processo.delete({ where: { numero } });
  }

  async atualizarStatusPorNumero(numero: string, pago: boolean) {
    return this.prisma.processo.update({
      where: { numero },
      data: { pago },
    });
  }

  async importarLote(dados: any[]) {
    const processos = dados.map((p) => ({
      numero: p['Número do processo'],
      ultimaMovimentacao: p['Última mov.'],
      vara: p['Vara'],
      requerente: p['Requerente'],
      requerido: p['Requerido'],
      dataDeposito: p['Data depósito'] ? this.converterData(p['Data depósito']) : null,
      valorDeposito: p['Valor depósito'] ? this.converterValor(p['Valor depósito']) : null,
      dataDevolucao: p['Data devolução'] ? this.converterData(p['Data devolução']) : null,
      valorDevolvido: p['Valor devolvido'] ? this.converterValor(p['Valor devolvido']) : null,
    }));

    const inseridos = await this.prisma.processo.createMany({
      data: processos,
      skipDuplicates: true,
    });

    return {
      mensagem: 'Importação concluída',
      registrosInseridos: inseridos.count,
    };
  }

  private converterData(data: string): Date | null {
    if (!data) return null;
    const [dia, mes, ano] = data.split('/');
    return new Date(Number(ano), Number(mes) - 1, Number(dia));
  }

  private converterValor(valor: string): number | null {
    if (!valor) return null;
    return Number(valor.replace(/[R$\s.]/g, '').replace(',', '.'));
  }

  async gerarRequerimentoPDF(numero: string, res: Response) {
    const processo = await this.prisma.processo.findUnique({ where: { numero } });
    if (!processo) throw new NotFoundException('Processo não encontrado');

    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="requerimento-${processo.numero}.pdf"`,
    );

    doc.pipe(res);

    doc
      .fontSize(14)
      .text(`Excelentíssimo(a) Senhor(a) Juiz(a) Federal da ${processo.vara}`, {
        align: 'center',
      });
    doc.moveDown();
    doc.fontSize(12).text(`Processo nº ${processo.numero}`);
    doc.moveDown();
    doc.text(
      `${processo.requerente}, por seu advogado, vem requerer a expedição de RPV referente ao valor depositado em ${processo.dataDeposito
        ? new Date(processo.dataDeposito).toLocaleDateString()
        : 'N/A'
      }, no montante de R$ ${processo.valorDeposito?.toFixed(2)}.`,
    );
    doc.moveDown();
    doc.text('Nestes termos,');
    doc.text('Pede deferimento.');
    doc.moveDown();
    doc.text(`Maceió, ${new Date().toLocaleDateString()}`);

    doc.end();
  }

  async gerarRequerimentoDOCX(numero: string, res: Response) {
    const processo = await this.prisma.processo.findUnique({ where: { numero } });
    if (!processo) throw new NotFoundException('Processo não encontrado');

    const dataAtual = new Date().toLocaleDateString('pt-BR');
    const dataDeposito = processo.dataDeposito
      ? new Date(processo.dataDeposito).toLocaleDateString('pt-BR')
      : '[DATA DEPÓSITO]';

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: `Excelentíssimo(a) Senhor(a) Juiz(a) Federal da ${processo.vara}`,
                  bold: true,
                  size: 28,
                }),
              ],
            }),
            new Paragraph({ text: '' }),
            new Paragraph({
              children: [new TextRun(`Processo nº ${processo.numero}`)],
            }),
            new Paragraph({ text: '' }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `${processo.requerente}, por seu advogado, vem respeitosamente à presença de Vossa Excelência requerer a expedição de RPV referente ao valor depositado em ${dataDeposito}, no montante de R$ ${processo.valorDeposito?.toFixed(2)}.`,
                }),
              ],
            }),
            new Paragraph({ text: '' }),
            new Paragraph({ text: 'Nestes termos,' }),
            new Paragraph({ text: 'Pede deferimento.' }),
            new Paragraph({ text: '' }),
            new Paragraph({
              children: [new TextRun(`Maceió, ${dataAtual}`)],
            }),
          ],
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);

    res.setHeader(
      'Content-Disposition',
      `attachment; filename=requerimento-${processo.numero}.docx`,
    );
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    );

    return res.send(buffer);
  }

  async listarTodosComEstimativa() {
    const processos = await this.prisma.processo.findMany();

    const valorizacoes: number[] = [];

    for (const proc of processos) {
      if (
        proc.valorDeposito &&
        proc.valorDevolvido &&
        proc.dataDeposito &&
        proc.dataDevolucao
      ) {
        const dias = this.diasEntre(proc.dataDeposito, proc.dataDevolucao);
        if (dias > 0 && Number(proc.valorDeposito) > 0) {
          const taxa = Number(proc.valorDevolvido) / Number(proc.valorDeposito);
          const anual = Math.pow(taxa, 365 / dias) - 1; // crescimento composto anual
          if (isFinite(anual) && anual > 0) {
            valorizacoes.push(anual);
          }
        }
      }
    }

    const mediaAnual = valorizacoes.length
      ? valorizacoes.reduce((a, b) => a + b, 0) / valorizacoes.length
      : 0;

    const hoje = new Date();

    const processosComEstimativa = processos.map((proc) => {
      let valorAtualizado: number | null = null;

      if (proc.valorDeposito && proc.dataDeposito && !proc.pago) {
        const diasDesdeDeposito = this.diasEntre(proc.dataDeposito, hoje);
        const fator = Math.pow(1 + mediaAnual, diasDesdeDeposito / 365);
        valorAtualizado = parseFloat((Number(proc.valorDeposito) * fator).toFixed(2));
      }

      return {
        ...proc,
        valorEstimadoAtual: valorAtualizado,
      };
    });

    return processosComEstimativa;
  }

  private diasEntre(data1: Date, data2: Date): number {
    const ms = Math.abs(data2.getTime() - data1.getTime());
    return Math.floor(ms / (1000 * 60 * 60 * 24));
  }

  async corrigirMovimentacoes() {
    const processos = await this.prisma.processo.findMany({
      where: {
        ultimaMovimentacao: { contains: 'Valor Dep' }, // restringe a quem precisa
      },
    });

    for (const proc of processos) {
      const campos = this.extrairInformacoes(proc.ultimaMovimentacao || '');
      console.log(`Processo ${proc.numero} - Movimentação:`, proc.ultimaMovimentacao);
      console.log(`Campos extraídos:`, campos);

      const camposValidos = Object.fromEntries(
        Object.entries(campos).filter(([, v]) => v !== undefined)
      );
      console.log(`Atualizando processo ${proc.numero} com campos:`, camposValidos);

      if (Object.keys(camposValidos).length > 0) {
        await this.prisma.processo.update({
          where: { numero: proc.numero },
          data: camposValidos,
        });
      }
    }

    return { atualizado: processos.length };
  }


  private extrairInformacoes(mov: string) {
    if (!mov) return {};

    const dataDepositoMatch = mov.match(/Data Dep.*?: (\d{2}\/\d{2}\/\d{4})/i);
    const valorDepositoMatch = mov.match(/Valor Dep.*?: R\$ ([\d.,]+)/i);
    const dataDevolucaoMatch = mov.match(/Data da Devol.*?: (\d{2}\/\d{2}\/\d{4})/i);
    const valorDevolvidoMatch = mov.match(/Valor Devol.*?: R\$ ([\d.,]+)/i);


    const parseValor = (v: string | undefined) =>
      v ? parseFloat(v.replace(/\./g, '').replace(',', '.')) : undefined;

    const parseData = (d: string | undefined) =>
      d ? new Date(d.split('/').reverse().join('-')) : undefined;

    return {
      dataDeposito: parseData(dataDepositoMatch?.[1]),
      valorDeposito: parseValor(valorDepositoMatch?.[1]),
      dataDevolucao: parseData(dataDevolucaoMatch?.[1]),
      valorDevolvido: parseValor(valorDevolvidoMatch?.[1]),
    };
  }


}
