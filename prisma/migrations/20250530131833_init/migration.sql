-- CreateTable
CREATE TABLE "Processo" (
    "id" SERIAL NOT NULL,
    "numero" TEXT NOT NULL,
    "ultimaMovimentacao" TEXT NOT NULL,
    "vara" TEXT NOT NULL,
    "requerente" TEXT NOT NULL,
    "requerido" TEXT NOT NULL,
    "dataDeposito" TIMESTAMP(3),
    "valorDeposito" DECIMAL(10,2),
    "dataDevolucao" TIMESTAMP(3),
    "valorDevolvido" DECIMAL(10,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Processo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Processo_numero_key" ON "Processo"("numero");
