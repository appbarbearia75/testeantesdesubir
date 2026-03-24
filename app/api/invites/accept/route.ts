import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

export async function POST(request: Request) {
    console.log('--- [accept-invite] Iniciando processamento ---')

    try {
        const body = await request.json()
        const { code, email, password, name, phone } = body

        console.log(`[accept-invite] Dados: email=${email}, code=${code}, name=${name}, phone=${phone}`)

        // Validação de campos obrigatórios
        if (!code || !email || !password || !name || !phone) {
            const camposFaltando = []
            if (!code) camposFaltando.push('código do convite')
            if (!name) camposFaltando.push('nome')
            if (!phone) camposFaltando.push('whatsapp')
            if (!email) camposFaltando.push('email')
            if (!password) camposFaltando.push('senha')

            console.warn('[accept-invite] Campos faltando:', camposFaltando.join(', '))
            return NextResponse.json(
                { success: false, error: `Campos obrigatórios não preenchidos: ${camposFaltando.join(', ')}.` },
                { status: 400 }
            )
        }

        // Validação básica de senha
        if (password.length < 6) {
            return NextResponse.json(
                { success: false, error: 'A senha deve ter no mínimo 6 caracteres.' },
                { status: 400 }
            )
        }

        const supabase = createAdminClient()

        // ============================================================
        // ETAPA 1: Validar e buscar dados do convite
        // ============================================================
        console.log(`[accept-invite] Etapa 1: Buscando convite code=${code}...`)
        const { data: invite, error: inviteError } = await supabase
            .from('invites')
            .select('*')
            .eq('code', code)
            .is('used_at', null)
            .single()

        if (inviteError || !invite) {
            console.error('[accept-invite] Convite inválido ou já usado:', inviteError?.message)
            return NextResponse.json(
                { success: false, error: 'Convite inválido, expirado ou já utilizado. Solicite um novo convite ao administrador.' },
                { status: 400 }
            )
        }

        if (!invite.barbershop_id) {
            console.error('[accept-invite] Convite sem barbershop_id (convite de super admin usado no fluxo errado)')
            return NextResponse.json(
                { success: false, error: 'Este convite não está vinculado a uma barbearia. Tipo de convite incompatível.' },
                { status: 400 }
            )
        }

        console.log(`[accept-invite] Convite válido — barbershop_id=${invite.barbershop_id}, role=${invite.role}, permissions=${JSON.stringify(invite.permissions)}`)

        // ============================================================
        // ETAPA 2: Criar usuário no Supabase Auth
        // ============================================================
        console.log(`[accept-invite] Etapa 2: Criando usuário ${email}...`)
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // Confirma e-mail automaticamente
            user_metadata: {
                name,
                phone,
                source: 'invite',
                invite_code: code
            }
        })

        if (authError) {
            console.error('[accept-invite] Erro ao criar usuário:', authError.message, authError.status)

            // Tratamento de erros específicos do Auth
            if (authError.message?.includes('already registered') || authError.status === 422) {
                return NextResponse.json(
                    { success: false, error: 'Este e-mail já está cadastrado. Faça login ou use outro e-mail.' },
                    { status: 409 }
                )
            }
            if (authError.message?.includes('Password should be at least')) {
                return NextResponse.json(
                    { success: false, error: 'A senha deve ter no mínimo 6 caracteres.' },
                    { status: 400 }
                )
            }
            if (authError.message?.includes('email rate limit')) {
                return NextResponse.json(
                    { success: false, error: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.' },
                    { status: 429 }
                )
            }

            return NextResponse.json(
                { success: false, error: `Erro ao criar conta: ${authError.message}` },
                { status: 500 }
            )
        }

        const userId = authData.user.id
        console.log(`[accept-invite] Usuário criado: ${userId}`)

        // ============================================================
        // ETAPA 3: Inserir na tabela barbers
        // ============================================================
        console.log(`[accept-invite] Etapa 3: Vinculando à barbearia ${invite.barbershop_id}...`)

        // Mapeamento de role do convite → role da tabela barbers
        const roleMap: Record<string, string> = {
            'colaborador': 'Funcionario',
            'freelance': 'Freelancer',
            'admin': 'Dono'
        }

        // Normalizar permissões: aceitar tanto { agenda, financial } quanto outros formatos
        const rawPerms = invite.permissions ?? { agenda: true, financial: false }
        const normalizedPermissions = {
            agenda: rawPerms.agenda ?? true,
            financial: rawPerms.financial ?? false
        }

        console.log(`[accept-invite] Permissões a aplicar:`, normalizedPermissions)

        const insertData: Record<string, any> = {
            id: userId,
            barbershop_id: invite.barbershop_id,
            name: name,
            phone: phone,
            role: roleMap[invite.role] || 'Funcionario',
            commission_value: invite.commission ?? 40,
            permissions: normalizedPermissions,
            active: true
        }

        const { error: insertError } = await supabase
            .from('barbers')
            .insert(insertData)

        if (insertError) {
            console.error('[accept-invite] Erro ao inserir barbeiro:', insertError.message, insertError.details, insertError.hint)

            // Rollback: deletar o usuário criado para não ficar órfão
            console.log(`[accept-invite] Rollback: deletando usuário ${userId}...`)
            await supabase.auth.admin.deleteUser(userId)

            // Verificar se é erro de chave duplicada
            if (insertError.message?.includes('duplicate key') || insertError.code === '23505') {
                return NextResponse.json(
                    { success: false, error: 'Este usuário já está vinculado a uma barbearia.' },
                    { status: 409 }
                )
            }

            return NextResponse.json(
                { success: false, error: `Erro ao vincular à barbearia: ${insertError.message}` },
                { status: 500 }
            )
        }

        console.log('[accept-invite] Barbeiro vinculado com sucesso')

        // ============================================================
        // ETAPA 4: Marcar convite como utilizado
        // ============================================================
        console.log('[accept-invite] Etapa 4: Marcando convite como utilizado...')
        const { error: updateError } = await supabase
            .from('invites')
            .update({
                used_at: new Date().toISOString(),
                used_by: userId
            })
            .eq('code', code)

        if (updateError) {
            // Não é crítico — o fluxo principal já foi concluído
            console.warn('[accept-invite] Aviso: falha ao marcar convite como usado:', updateError.message)
        } else {
            console.log('[accept-invite] Convite marcado como utilizado')
        }

        // ============================================================
        // SUCESSO
        // ============================================================
        console.log('--- [accept-invite] Fluxo concluído com SUCESSO ---')
        return NextResponse.json({
            success: true,
            barbershop_id: invite.barbershop_id,
            user_id: userId
        })

    } catch (err: any) {
        console.error('[accept-invite] ERRO FATAL:', err.message, err.stack)

        // Mensagem amigável mas com detalhes para debug
        const isEnvError = err.message?.includes('SUPABASE_SERVICE_ROLE_KEY') || err.message?.includes('NEXT_PUBLIC_SUPABASE_URL')
        const userMessage = isEnvError
            ? 'Erro de configuração do servidor. Entre em contato com o administrador.'
            : `Erro ao processar cadastro: ${err.message}`

        return NextResponse.json(
            {
                success: false,
                error: userMessage,
                // Detalhes extras apenas em desenvolvimento
                ...(process.env.NODE_ENV === 'development' && { details: err.message, stack: err.stack })
            },
            { status: 500 }
        )
    }
}
