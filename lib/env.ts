/**
 * Validação centralizada de variáveis de ambiente.
 * Garante que o aplicativo falhe rapidamente se as configurações obrigatórias estiverem ausentes.
 */

// 1. Variáveis Públicas (Podem ser usadas no frontend e backend)
const NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// 2. Variáveis Privadas (Devem ser usadas APENAS no backend/API routes)
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

// Validação - Frontend & Backend
if (!NEXT_PUBLIC_SUPABASE_URL || NEXT_PUBLIC_SUPABASE_URL.trim() === '') {
    throw new Error(
        "Missing NEXT_PUBLIC_SUPABASE_URL: Verifique se o arquivo .env.local existe e contém a variável NEXT_PUBLIC_SUPABASE_URL."
    )
}

if (!NEXT_PUBLIC_SUPABASE_ANON_KEY || NEXT_PUBLIC_SUPABASE_ANON_KEY.trim() === '') {
    throw new Error(
        "Missing NEXT_PUBLIC_SUPABASE_ANON_KEY: Verifique se o arquivo .env.local existe e contém a variável NEXT_PUBLIC_SUPABASE_ANON_KEY."
    )
}

// Opcional: Verificação para não expor a service key acidentalmente no lado do cliente
if (typeof window !== 'undefined' && SUPABASE_SERVICE_ROLE_KEY) {
    console.warn("ALERTA DE SEGURANÇA: SUPABASE_SERVICE_ROLE_KEY está acessível no código do frontend!")
}

export const env = {
    supabaseUrl: NEXT_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: NEXT_PUBLIC_SUPABASE_ANON_KEY,
    // Service Role Key pode ser undefined no frontend, o que é o correto.
    // O backend fará a própria validação ao importá-la.
    supabaseServiceRoleKey: SUPABASE_SERVICE_ROLE_KEY,
}
