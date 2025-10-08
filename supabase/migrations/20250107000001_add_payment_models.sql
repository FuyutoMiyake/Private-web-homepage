-- Add new models for Payment, IdempotencyKey, and EmailEvent
-- These are the models added in Phase 1 implementation

-- Update Entitlement table structure (add new fields if they don't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Entitlement' AND column_name = 'kind') THEN
        ALTER TABLE "Entitlement" ADD COLUMN "kind" TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Entitlement' AND column_name = 'source') THEN
        ALTER TABLE "Entitlement" ADD COLUMN "source" TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Entitlement' AND column_name = 'status') THEN
        ALTER TABLE "Entitlement" ADD COLUMN "status" TEXT DEFAULT 'active';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Entitlement' AND column_name = 'currentPeriodStart') THEN
        ALTER TABLE "Entitlement" ADD COLUMN "currentPeriodStart" TIMESTAMP(3);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Entitlement' AND column_name = 'currentPeriodEnd') THEN
        ALTER TABLE "Entitlement" ADD COLUMN "currentPeriodEnd" TIMESTAMP(3);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Entitlement' AND column_name = 'stripeSubscriptionId') THEN
        ALTER TABLE "Entitlement" ADD COLUMN "stripeSubscriptionId" TEXT UNIQUE;
    END IF;
END $$;

-- Create Payment table
CREATE TABLE IF NOT EXISTS "Payment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "provider" TEXT NOT NULL,
    "extId" TEXT UNIQUE,
    "amountJpy" INTEGER,
    "currency" TEXT,
    "status" TEXT NOT NULL,
    "meta" JSONB,
    "userId" TEXT,
    "postId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "Payment_userId_idx" ON "Payment"("userId");
CREATE INDEX IF NOT EXISTS "Payment_status_idx" ON "Payment"("status");

-- Create IdempotencyKey table
CREATE TABLE IF NOT EXISTS "IdempotencyKey" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "IdempotencyKey_createdAt_idx" ON "IdempotencyKey"("createdAt");

-- Create EmailEvent table
CREATE TABLE IF NOT EXISTS "EmailEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "toMasked" TEXT NOT NULL,
    "messageId" TEXT UNIQUE,
    "dryRun" BOOLEAN NOT NULL DEFAULT true,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "EmailEvent_type_createdAt_idx" ON "EmailEvent"("type", "createdAt");
CREATE INDEX IF NOT EXISTS "EmailEvent_messageId_idx" ON "EmailEvent"("messageId");

-- Create index on Entitlement stripeSubscriptionId if it doesn't exist
CREATE INDEX IF NOT EXISTS "Entitlement_stripeSubscriptionId_idx" ON "Entitlement"("stripeSubscriptionId");
CREATE INDEX IF NOT EXISTS "Entitlement_userId_kind_postId_idx" ON "Entitlement"("userId", "kind", "postId");
