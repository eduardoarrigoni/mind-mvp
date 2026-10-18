import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class AceiteTcleDto {
  /** Versão do termo que o usuário leu (deve ser a vigente). */
  @IsString()
  @IsNotEmpty({ message: 'Informe a versão do termo aceito.' })
  @MaxLength(20)
  versao: string;
}
