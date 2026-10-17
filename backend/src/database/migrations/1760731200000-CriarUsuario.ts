import { MigrationInterface, QueryRunner } from 'typeorm';

/** PB02 – tabela única de usuários (herança Paciente/Profissional por `papel`). */
export class CriarUsuario1760731200000 implements MigrationInterface {
  name = 'CriarUsuario1760731200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."usuario_papel_enum" AS ENUM('PACIENTE', 'PROFISSIONAL')`,
    );
    await queryRunner.query(
      `CREATE TABLE "usuario" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "criado_em" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "atualizado_em" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "nome" character varying(120) NOT NULL, "email" character varying(160) NOT NULL, "senha_hash" character varying(100) NOT NULL, "data_nascimento" date, "registro_profissional" character varying(40), "papel" "public"."usuario_papel_enum" NOT NULL, CONSTRAINT "UQ_usuario_email" UNIQUE ("email"), CONSTRAINT "PK_a56c58e5cabaa04fb2c98d2d7e2" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_848089431d2e52f98b47cd3ac3" ON "usuario" ("papel")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_848089431d2e52f98b47cd3ac3"`,
    );
    await queryRunner.query(`DROP TABLE "usuario"`);
    await queryRunner.query(`DROP TYPE "public"."usuario_papel_enum"`);
  }
}
