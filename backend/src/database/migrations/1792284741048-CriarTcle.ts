import { MigrationInterface, QueryRunner } from 'typeorm';

/** Texto da versão 1.0 do TCLE (UC13). Novas versões entram por nova migration. */
export const TCLE_V1 = `TERMO DE CONSENTIMENTO LIVRE E ESCLARECIDO – MIND (versão 1.0)

1. O que é o Mind. O Mind é um aplicativo de apoio ao acompanhamento de saúde mental. Ele permite registrar como você está no dia a dia (humor, energia, sono e observações) e, se você autorizar, compartilhar esses registros com o profissional de saúde que acompanha você.

2. O Mind não substitui atendimento profissional. O aplicativo não faz diagnóstico nem tratamento. Em situação de crise ou risco, procure imediatamente um serviço de saúde, o CVV (ligue 188) ou o SAMU (ligue 192).

3. Quais dados são coletados. Nome, e-mail, data de nascimento e os registros que você fizer no aplicativo. Esses registros são dados pessoais sensíveis de saúde (LGPD, Lei nº 13.709/2018, art. 5º, II).

4. Para que os dados são usados. Somente para mostrar a você o seu histórico e, quando você autorizar, para o acompanhamento pelo profissional de saúde vinculado. Os dados não são vendidos nem compartilhados com terceiros para fins comerciais.

5. Segurança. As senhas são armazenadas de forma criptografada e o acesso aos dados exige autenticação.

6. Seus direitos. Você pode, a qualquer momento, consultar, corrigir ou pedir a exclusão dos seus dados e revogar este consentimento. A revogação impede novos registros, mas não afeta o que foi feito antes dela.

7. Participação voluntária. O uso do Mind é voluntário. Ao tocar em "Li e aceito", você declara que leu este termo, entendeu as informações e concorda com o tratamento dos seus dados nas condições descritas.`;

/** PB07 – termo de consentimento (versões) e aceites dos usuários. */
export class CriarTcle1792284741048 implements MigrationInterface {
  name = 'CriarTcle1792284741048';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "termo_consentimento" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "criado_em" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "atualizado_em" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "versao" character varying(20) NOT NULL, "texto" text NOT NULL, "vigente_desde" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "UQ_termo_consentimento_versao" UNIQUE ("versao"), CONSTRAINT "PK_282ad591516d724e3ff7ff50479" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "aceite_tcle" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "criado_em" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "atualizado_em" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "aceito_em" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "usuario_id" uuid NOT NULL, "termo_id" uuid NOT NULL, CONSTRAINT "UQ_aceite_tcle_usuario_termo" UNIQUE ("usuario_id", "termo_id"), CONSTRAINT "PK_0a397f65d8e39cbf6f4d62f6b9d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "aceite_tcle" ADD CONSTRAINT "FK_5a3dbcd62bfe3c6b37de406b31c" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "aceite_tcle" ADD CONSTRAINT "FK_57a03b2d2942b2e2de11a038c07" FOREIGN KEY ("termo_id") REFERENCES "termo_consentimento"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `INSERT INTO "termo_consentimento" ("versao", "texto", "vigente_desde") VALUES ($1, $2, now())`,
      ['1.0', TCLE_V1],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "aceite_tcle" DROP CONSTRAINT "FK_57a03b2d2942b2e2de11a038c07"`,
    );
    await queryRunner.query(
      `ALTER TABLE "aceite_tcle" DROP CONSTRAINT "FK_5a3dbcd62bfe3c6b37de406b31c"`,
    );
    await queryRunner.query(`DROP TABLE "aceite_tcle"`);
    await queryRunner.query(`DROP TABLE "termo_consentimento"`);
  }
}
