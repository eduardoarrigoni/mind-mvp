import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Usuario } from '../usuarios/usuario.entity.js';
import { AceiteTcleDAO, TermoConsentimentoDAO } from './consentimento.dao.js';
import { AceiteTcle, TermoConsentimento } from './consentimento.entity.js';

export interface TermoPublico {
  versao: string;
  texto: string;
  vigenteDesde: Date;
}

export interface AceitePublico {
  versao: string;
  aceitoEm: Date;
}

/** AplConsentimento – UC13: leitura e aceite do TCLE vigente. */
@Injectable()
export class AplConsentimento {
  constructor(
    private readonly termos: TermoConsentimentoDAO,
    private readonly aceites: AceiteTcleDAO,
  ) {}

  async termoVigente(): Promise<TermoPublico> {
    const { versao, texto, vigenteDesde } = await this.buscarVigente();
    return { versao, texto, vigenteDesde };
  }

  /**
   * Registra o aceite do usuário. A versão informada precisa ser a vigente,
   * garantindo que o usuário aceitou o texto que de fato leu. Idempotente.
   */
  async aceitar(usuarioId: string, versao: string): Promise<AceitePublico> {
    const termo = await this.buscarVigente();
    if (versao !== termo.versao) {
      throw new ConflictException(
        'O termo foi atualizado. Leia a versão vigente antes de aceitar.',
      );
    }

    const existente = await this.aceites.buscarAceite(usuarioId, termo.id);
    if (existente) return this.paraPublico(existente, termo);

    const aceite = Object.assign(new AceiteTcle(), {
      usuario: { id: usuarioId } as Usuario,
      termo,
    });
    try {
      return this.paraPublico(await this.aceites.salvar(aceite), termo);
    } catch (erro) {
      // Dois aceites simultâneos: a restrição única garante um só registro.
      if ((erro as { code?: string }).code === '23505') {
        const registrado = await this.aceites.buscarAceite(usuarioId, termo.id);
        if (registrado) return this.paraPublico(registrado, termo);
      }
      throw erro;
    }
  }

  /** O usuário já aceitou a versão vigente? */
  async aceitouVigente(usuarioId: string): Promise<boolean> {
    const termo = await this.termos.buscarVigente();
    if (!termo) return false;
    return (await this.aceites.buscarAceite(usuarioId, termo.id)) !== null;
  }

  private async buscarVigente(): Promise<TermoConsentimento> {
    const termo = await this.termos.buscarVigente();
    if (!termo) throw new NotFoundException('Nenhum TCLE vigente cadastrado.');
    return termo;
  }

  private paraPublico(
    aceite: AceiteTcle,
    termo: TermoConsentimento,
  ): AceitePublico {
    return { versao: termo.versao, aceitoEm: aceite.aceitoEm };
  }
}
