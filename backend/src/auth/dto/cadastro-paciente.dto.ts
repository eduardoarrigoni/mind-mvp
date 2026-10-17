import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsISO8601,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CadastroPacienteDto {
  @IsString()
  @IsNotEmpty({ message: 'Informe o nome.' })
  @MaxLength(120)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  nome: string;

  @IsEmail({}, { message: 'Informe um e-mail válido.' })
  @MaxLength(160)
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  email: string;

  @IsISO8601(
    { strict: true },
    { message: 'Informe a data de nascimento no formato AAAA-MM-DD.' },
  )
  dataNascimento: string;

  @IsString()
  @MinLength(8, { message: 'A senha deve ter ao menos 8 caracteres.' })
  @MaxLength(72, { message: 'A senha deve ter no máximo 72 caracteres.' })
  senha: string;
}
