import { Transform } from 'class-transformer';
import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

const escala = (campo: string) => ({
  message: `${campo} deve ser um número inteiro de 1 a 5.`,
});

export class CheckinDto {
  @IsInt(escala('Humor'))
  @Min(1, escala('Humor'))
  @Max(5, escala('Humor'))
  humor: number;

  @IsInt(escala('Energia'))
  @Min(1, escala('Energia'))
  @Max(5, escala('Energia'))
  energia: number;

  @IsNumber(
    { maxDecimalPlaces: 1 },
    { message: 'Horas de sono deve ser um número com até 1 casa decimal.' },
  )
  @Min(0, { message: 'Horas de sono deve estar entre 0 e 24.' })
  @Max(24, { message: 'Horas de sono deve estar entre 0 e 24.' })
  horasSono: number;

  @IsOptional()
  @IsString()
  @MaxLength(500, {
    message: 'A observação deve ter no máximo 500 caracteres.',
  })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() || null : value,
  )
  observacao?: string | null;
}
