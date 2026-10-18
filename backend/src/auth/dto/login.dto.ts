import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class LoginDto {
  // Sem validar formato: um e-mail malformado deve receber o mesmo 401 genérico.
  @IsString()
  @IsNotEmpty({ message: 'Informe o e-mail.' })
  @MaxLength(160)
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Informe a senha.' })
  @MaxLength(72)
  senha: string;
}
