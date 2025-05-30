import { PartialType } from '@nestjs/mapped-types';
import { CreateProcessoDto } from './create-processo.dto';

export class UpdateProcessoDto extends PartialType(CreateProcessoDto) {}
