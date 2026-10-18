import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CheckinDto } from './checkin.dto.js';

/** Valida o corpo exatamente como o ValidationPipe da aplicação faz. */
async function errosDe(corpo: object): Promise<string[]> {
  const erros = await validate(plainToInstance(CheckinDto, corpo), {
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  return erros.map((e) => e.property);
}

const valido = { humor: 3, energia: 3, horasSono: 7 };

describe('CheckinDto – faixas do check-in (PB15)', () => {
  it.each([
    ['mínimos', { humor: 1, energia: 1, horasSono: 0 }],
    ['máximos', { humor: 5, energia: 5, horasSono: 24 }],
    ['sono com meia hora', { ...valido, horasSono: 7.5 }],
    [
      'observação de 500 caracteres',
      { ...valido, observacao: 'x'.repeat(500) },
    ],
    ['observação nula', { ...valido, observacao: null }],
  ])('aceita %s', async (_caso, corpo) => {
    expect(await errosDe(corpo)).toEqual([]);
  });

  it.each([
    ['humor 0', { ...valido, humor: 0 }, 'humor'],
    ['humor 6', { ...valido, humor: 6 }, 'humor'],
    ['humor 2,5', { ...valido, humor: 2.5 }, 'humor'],
    ['humor em texto', { ...valido, humor: '3' }, 'humor'],
    ['energia ausente', { humor: 3, horasSono: 7 }, 'energia'],
    ['energia 6', { ...valido, energia: 6 }, 'energia'],
    ['sono −0,5', { ...valido, horasSono: -0.5 }, 'horasSono'],
    ['sono 24,5', { ...valido, horasSono: 24.5 }, 'horasSono'],
    ['sono com 2 casas', { ...valido, horasSono: 7.25 }, 'horasSono'],
    [
      'observação de 501',
      { ...valido, observacao: 'x'.repeat(501) },
      'observacao',
    ],
    ['campo não previsto', { ...valido, pacienteId: 'outro' }, 'pacienteId'],
  ])('recusa %s', async (_caso, corpo, campo) => {
    expect(await errosDe(corpo)).toContain(campo);
  });

  it('observação só com espaços vira nula', () => {
    const dto = plainToInstance(CheckinDto, { ...valido, observacao: '   ' });
    expect(dto.observacao).toBeNull();
  });
});
