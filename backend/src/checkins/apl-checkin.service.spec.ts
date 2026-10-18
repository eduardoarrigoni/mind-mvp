import { AplCheckin } from './apl-checkin.service.js';
import { CheckinDAO } from './checkin.dao.js';
import { Checkin } from './checkin.entity.js';
import { dataLocal, somarDias } from './data-local.js';

const dados = { humor: 4, energia: 3, horasSono: 7.5, observacao: 'Dia bom' };

function montar() {
  const dao = {
    buscarDoDia: vi.fn().mockResolvedValue(null),
    salvar: vi.fn().mockImplementation(async (c: Checkin) =>
      Object.assign(c, {
        id: c.id ?? 'checkin-1',
        criadoEm: c.criadoEm ?? new Date(),
        atualizadoEm: new Date(),
      }),
    ),
  };
  return { dao, apl: new AplCheckin(dao as unknown as CheckinDAO) };
}

describe('AplCheckin – check-in diário (UC04)', () => {
  // 18/10/2026 01:30 UTC = 17/10/2026 22:30 em São Paulo (UTC−3).
  const noiteDe17 = new Date('2026-10-18T01:30:00Z');

  it('cria o check-in do dia vinculado ao paciente do token', async () => {
    const { apl, dao } = montar();
    const { checkin, criado } = await apl.registrar(
      'paciente-1',
      dados,
      noiteDe17,
    );

    expect(criado).toBe(true);
    expect(checkin).toMatchObject({ data: '2026-10-17', ...dados });
    const salvo = dao.salvar.mock.calls[0][0] as Checkin;
    expect(salvo.paciente.id).toBe('paciente-1');
    expect(dao.buscarDoDia).toHaveBeenCalledWith('paciente-1', '2026-10-17');
  });

  it('segundo envio no mesmo dia atualiza o existente', async () => {
    const { apl, dao } = montar();
    const existente = Object.assign(new Checkin(), {
      id: 'checkin-1',
      data: '2026-10-17',
      humor: 2,
      energia: 2,
      horasSono: 5,
      observacao: 'antes',
      criadoEm: new Date('2026-10-17T12:00:00Z'),
    });
    dao.buscarDoDia.mockResolvedValue(existente);

    const { checkin, criado } = await apl.registrar(
      'paciente-1',
      { humor: 5, energia: 4, horasSono: 8 },
      noiteDe17,
    );

    expect(criado).toBe(false);
    expect(checkin).toMatchObject({
      id: 'checkin-1',
      humor: 5,
      energia: 4,
      horasSono: 8,
      observacao: null,
    });
    expect(dao.salvar).toHaveBeenCalledTimes(1);
  });

  it('envios simultâneos (violação de unicidade): o segundo vira atualização', async () => {
    const { apl, dao } = montar();
    const gravado = Object.assign(new Checkin(), {
      id: 'checkin-1',
      data: '2026-10-17',
    });
    dao.buscarDoDia.mockResolvedValueOnce(null).mockResolvedValueOnce(gravado);
    dao.salvar
      .mockRejectedValueOnce(Object.assign(new Error('dup'), { code: '23505' }))
      .mockImplementationOnce(async (c: Checkin) => c);

    const { checkin, criado } = await apl.registrar(
      'paciente-1',
      dados,
      noiteDe17,
    );
    expect(criado).toBe(false);
    expect(checkin.id).toBe('checkin-1');
  });

  it('outros erros do banco são propagados', async () => {
    const { apl, dao } = montar();
    dao.salvar.mockRejectedValue(new Error('banco fora do ar'));
    await expect(apl.registrar('paciente-1', dados)).rejects.toThrow(
      'banco fora do ar',
    );
  });
});

describe('AplCheckin – histórico (UC10 parcial)', () => {
  const noiteDe17 = new Date('2026-10-18T01:30:00Z'); // 17/10 22:30 em SP

  it('busca do paciente do token a partir de hoje − (dias − 1)', async () => {
    const { apl, dao } = montar();
    const lista = [
      Object.assign(new Checkin(), { id: 'c2', data: '2026-10-17', humor: 4 }),
      Object.assign(new Checkin(), { id: 'c1', data: '2026-10-10', humor: 2 }),
    ];
    Object.assign(dao, { listarDesde: vi.fn().mockResolvedValue(lista) });

    const historico = await apl.historico('paciente-1', 30, noiteDe17);

    expect(
      (dao as unknown as { listarDesde: ReturnType<typeof vi.fn> }).listarDesde,
    ).toHaveBeenCalledWith('paciente-1', '2026-09-18');
    expect(historico.map((c) => c.id)).toEqual(['c2', 'c1']);
  });

  it('janela de 1 dia = só hoje; padrão = 30 dias', async () => {
    const { apl, dao } = montar();
    const listarDesde = vi.fn().mockResolvedValue([]);
    Object.assign(dao, { listarDesde });

    await apl.historico('p', 1, noiteDe17);
    await apl.historico('p', undefined, noiteDe17);
    expect(listarDesde.mock.calls.map((c) => c[1])).toEqual([
      '2026-10-17',
      '2026-09-18',
    ]);
  });
});

describe('somarDias', () => {
  it('atravessa meses e anos', () => {
    expect(somarDias('2026-10-01', -1)).toBe('2026-09-30');
    expect(somarDias('2026-12-31', 1)).toBe('2027-01-01');
    expect(somarDias('2024-03-01', -1)).toBe('2024-02-29');
  });
});

describe('dataLocal', () => {
  it('usa o fuso de São Paulo para definir o dia', () => {
    expect(dataLocal(new Date('2026-10-18T02:59:00Z'))).toBe('2026-10-17');
    expect(dataLocal(new Date('2026-10-18T03:00:00Z'))).toBe('2026-10-18');
  });
});
