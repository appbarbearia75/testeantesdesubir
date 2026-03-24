import { createClient } from '@supabase/supabase-js'

/**
 * Cliente Supabase com Service Role Key — APENAS para uso em API routes (server-side).
 * Ignora RLS e possui permissões administrativas completas.
 * 
 * NUNCA importe este módulo em componentes client-side.
 */
export function createAdminClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl) {
        throw new Error(
            'NEXT_PUBLIC_SUPABASE_URL não está configurada. ' +
            'Verifique o arquivo .env.local na raiz do projeto.'
        )
    }

    if (!serviceRoleKey || serviceRoleKey === 'COLE_SUA_SERVICE_ROLE_KEY_AQUI') {
        throw new Error(
            'SUPABASE_SERVICE_ROLE_KEY não está configurada. ' +
            'Acesse: Supabase Dashboard → Settings → API → Service Role Key, ' +
            'copie a chave e cole no arquivo .env.local na raiz do projeto.'
        )
    }

    return createClient(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })
}
