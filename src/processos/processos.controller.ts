/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  BadRequestException,
  Res,
} from '@nestjs/common';
import { ProcessosService } from './processos.service';
import { CreateProcessoDto } from './dtos/create-processo.dto';
// import { UpdateProcessoDto } from './dtos/update-processo.dto';
import { Response } from 'express';

@Controller('processos')
export class ProcessosController {
  constructor(private readonly processosService: ProcessosService) {}

  @Post()
  create(@Body() dto: CreateProcessoDto) {
    return this.processosService.create(dto);
  }

  @Get()
  async listarComEstimativa() {
    return this.processosService.listarTodosComEstimativa();
  }

  @Get(':numero')
  findOne(@Param('numero') numero: string) {
    return this.processosService.findOne(numero);
  }

  // @Patch(':numero')
  // update(@Param('numero') numero: string, @Body() dto: UpdateProcessoDto) {
  //   return this.processosService.update(numero, dto);
  // }

  @Delete(':numero')
  remove(@Param('numero') numero: string) {
    return this.processosService.remove(numero);
  }

  @Post('importar')
  async importar(@Body() body: CreateProcessoDto[]) {
    if (!Array.isArray(body)) {
      throw new BadRequestException('O payload deve ser um array de objetos.');
    }

    return this.processosService.importarLote(body);
  }

  @Get(':numero/requerimento.pdf')
  async gerarPDF(@Param('numero') numero: string, @Res() res: Response) {
    return this.processosService.gerarRequerimentoPDF(numero, res);
  }

  @Get(':numero/requerimento.docx')
  async gerarDOCX(@Param('numero') numero: string, @Res() res: Response) {
    return this.processosService.gerarRequerimentoDOCX(numero, res);
  }

  @Patch(':numero/status')
  async atualizarStatus(
    @Param('numero') numero: string,
    @Body('pago') pago: boolean,
  ) {
    return this.processosService.atualizarStatusPorNumero(numero, pago);
  }

  @Patch('corrigirMovimentacoes')
  async corrigirMovimentacoes() {
    return this.processosService.corrigirMovimentacoes();
  }
}
