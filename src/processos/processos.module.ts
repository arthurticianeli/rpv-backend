import { Module } from '@nestjs/common';
import { ProcessosService } from './processos.service';
import { ProcessosController } from './processos.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [ProcessosController],
  providers: [ProcessosService, PrismaService],
})
export class ProcessosModule {}
