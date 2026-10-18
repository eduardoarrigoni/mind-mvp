import { MigrationInterface, QueryRunner } from 'typeorm';

/** PB11 – check-in diário (um por paciente por dia, faixas validadas no banco). */
export class CriarCheckin1792360847370 implements MigrationInterface {
  name = 'CriarCheckin1792360847370';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "checkin" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "criado_em" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "atualizado_em" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "data" date NOT NULL, "humor" smallint NOT NULL, "energia" smallint NOT NULL, "horas_sono" numeric(3,1) NOT NULL, "observacao" character varying(500), "paciente_id" uuid NOT NULL, CONSTRAINT "UQ_checkin_paciente_data" UNIQUE ("paciente_id", "data"), CONSTRAINT "CHK_checkin_horas_sono" CHECK ("horas_sono" BETWEEN 0 AND 24), CONSTRAINT "CHK_checkin_energia" CHECK ("energia" BETWEEN 1 AND 5), CONSTRAINT "CHK_checkin_humor" CHECK ("humor" BETWEEN 1 AND 5), CONSTRAINT "PK_ceddab0cc0235c228a841bac49e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "checkin" ADD CONSTRAINT "FK_a6cc8b77c5b10c27fda6f3ef890" FOREIGN KEY ("paciente_id") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "checkin" DROP CONSTRAINT "FK_a6cc8b77c5b10c27fda6f3ef890"`,
    );
    await queryRunner.query(`DROP TABLE "checkin"`);
  }
}
