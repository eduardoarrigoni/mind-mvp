import { ErroApi, mensagemDeErro, requisicao, URL_API } from '../api/cliente';

const respostaJson = (status: number, corpo: unknown) =>
  ({
    ok: status >= 200 && status < 300,
    status,
    text: async () => (corpo === undefined ? '' : JSON.stringify(corpo)),
  }) as Response;

describe('cliente HTTP', () => {
  const fetchOriginal = global.fetch;
  afterEach(() => {
    global.fetch = fetchOriginal;
  });

  it('envia JSON, token e devolve o corpo da resposta', async () => {
    const espiao = jest.fn().mockResolvedValue(respostaJson(201, { id: '1' }));
    global.fetch = espiao;

    const dados = await requisicao<{ id: string }>('/auth/cadastro', {
      metodo: 'POST',
      corpo: { nome: 'Ana' },
      token: 'abc',
    });

    expect(dados).toEqual({ id: '1' });
    const [url, init] = espiao.mock.calls[0];
    expect(url).toBe(`${URL_API}/auth/cadastro`);
    expect(init.method).toBe('POST');
    expect(init.headers).toMatchObject({
      'Content-Type': 'application/json',
      Authorization: 'Bearer abc',
    });
    expect(JSON.parse(init.body)).toEqual({ nome: 'Ana' });
  });

  it('transforma erro da API em ErroApi com a mensagem do servidor', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue(
        respostaJson(409, { message: 'Já existe uma conta com este e-mail.' }),
      );

    await expect(
      requisicao('/auth/cadastro', { metodo: 'POST', corpo: {} }),
    ).rejects.toEqual(new ErroApi(409, 'Já existe uma conta com este e-mail.'));
  });

  it('informa falha de conexão de forma legível', async () => {
    global.fetch = jest
      .fn()
      .mockRejectedValue(new TypeError('Network request failed'));
    await expect(requisicao('/qualquer')).rejects.toMatchObject({
      status: 0,
      message: 'Não foi possível conectar ao servidor.',
    });
  });

  it('junta mensagens de validação do NestJS', () => {
    expect(
      mensagemDeErro({ message: ['Informe o nome.', 'E-mail inválido.'] }, 400),
    ).toBe('Informe o nome.\nE-mail inválido.');
    expect(mensagemDeErro(null, 500)).toBe(
      'Erro inesperado (500). Tente novamente.',
    );
  });
});
