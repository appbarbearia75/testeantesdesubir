-- Tabela de convites para barbeiros
CREATE TABLE IF NOT EXISTS invites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    barbershop_id UUID NOT NULL REFERENCES barbershops(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'colaborador' CHECK (role IN ('colaborador', 'freelance', 'admin')),
    commission NUMERIC(5, 2) DEFAULT 40,
    permissions JSONB DEFAULT '{"agenda": true, "financial": false}'::jsonb,
    used_at TIMESTAMPTZ,
    used_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_invites_code ON invites(code);
CREATE INDEX IF NOT EXISTS idx_invites_barbershop_id ON invites(barbershop_id);

-- RLS
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;

-- Admins podem criar e ler convites da sua barbearia
CREATE POLICY "Barbers can manage invites" ON invites
    FOR ALL
    USING (
        barbershop_id IN (
            SELECT barbershop_id FROM barbers WHERE id = auth.uid()
        )
    );

-- Service role pode fazer tudo (usado na API)
CREATE POLICY "Service role full access" ON invites
    FOR ALL
    USING (true)
    WITH CHECK (true);
