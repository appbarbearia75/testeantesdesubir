import { createClient } from '@supabase/supabase-js'
import { env } from './env'

/**
 * Cliente Supabase com Service Role Key — APENAS para uso em API routes (server-side).
 * Ignora RLS e possui permissões administrativas completas.
 * 
 * NUNCA importe este módulo em componentes client-side.
 */
export function createAdminClient() {
    const supabaseUrl = env.supabaseUrl
    const serviceRoleKey = env.supabaseServiceRoleKey

    if (!serviceRoleKey || serviceRoleKey.trim() === '' || serviceRoleKey === 'COLE_SUA_SERVICE_ROLE_KEY_AQUI') {
        throw new Error(
            'Missing SUPABASE_SERVICE_ROLE_KEY: \n' +
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
