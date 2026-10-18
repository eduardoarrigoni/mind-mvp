import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export const DIAS_PADRAO = 30;
export const DIAS_MAXIMO = 90;

export class HistoricoQueryDto {
  /** Janela do histórico em dias, contando hoje (padrão 30). */
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: `dias deve ser um inteiro de 1 a ${DIAS_MAXIMO}.` })
  @Min(1, { message: `dias deve ser um inteiro de 1 a ${DIAS_MAXIMO}.` })
  @Max(DIAS_MAXIMO, {
    message: `dias deve ser um inteiro de 1 a ${DIAS_MAXIMO}.`,
  })
  dias?: number;
}
