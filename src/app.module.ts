import { Module } from '@nestjs/common';
import { ProcessosModule } from './processos/processos.module';

@Module({
  imports: [ProcessosModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
