-- CreateTable
CREATE TABLE "AgentHistory" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "targetAgentId" TEXT,

    CONSTRAINT "AgentHistory_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AgentHistory" ADD CONSTRAINT "AgentHistory_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentHistory" ADD CONSTRAINT "AgentHistory_targetAgentId_fkey" FOREIGN KEY ("targetAgentId") REFERENCES "Agent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
