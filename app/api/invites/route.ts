import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

export async function POST(request: Request) {
    try {
        const supabase = createAdminClient()

        // Safe parse do body
        let body: any = {}
        try {
            const text = await request.text()
            if (text) {
                body = JSON.parse(text)
            }
        } catch (e) {
            // Body vazio ou inválido
        }

        const { barbershop_id, role, commission, permissions } = body

        // Gerar código único
        const code = Math.random().toString(36).substring(2, 10).toUpperCase()

        if (barbershop_id) {
            // --- FLUXO 1: Convite de Colaborador/Freelancer ---
            if (!role) {
                return NextResponse.json({ error: 'A role é obrigatória para convites de equipe.' }, { status: 400 })
            }

            const { error } = await supabase
                .from('invites')
                .insert([{
                    code,
                    barbershop_id,
                    role,
                    commission: commission ?? 40,
                    permissions: permissions ?? { agenda: true, financial: false }
                }])

            if (error) {
                console.error('[API /invites POST] Erro ao criar convite:', error.message, error.details, error.hint)
                return NextResponse.json({ error: `Erro ao criar convite: ${error.message}` }, { status: 500 })
            }
            return NextResponse.json({ code })
        } else {
            // --- FLUXO 2: Convite Super Admin (Nova Barbearia) ---
            const { error } = await supabase
                .from('invites')
                .insert([{
                    code,
                    role: 'admin',
                    commission: 0,
                    permissions: { agenda: true, financial: true }
                }])

            if (error) {
                console.error('[API /invites POST] Erro ao criar convite admin:', error.message, error.details, error.hint)
                return NextResponse.json({ error: `Erro ao criar convite: ${error.message}` }, { status: 500 })
            }
            return NextResponse.json({ code })
        }
    } catch (err: any) {
        console.error('[API /invites POST] Erro fatal:', err.message)
        return NextResponse.json({ error: err.message || 'Erro ao processar requisição.' }, { status: 500 })
    }
}

export async function GET(request: Request) {
    try {
        const supabase = createAdminClient()
        const { searchParams } = new URL(request.url)
        const code = searchParams.get('code')

        if (!code) {
            return NextResponse.json({ valid: false, error: 'Código do convite não informado.' }, { status: 400 })
        }

        // Buscar convite não utilizado
        const { data, error } = await supabase
            .from('invites')
            .select('code, barbershop_id, role, commission, permissions, created_at')
            .eq('code', code)
            .is('used_at', null)
            .single()

        if (error || !data) {
            console.warn('[API /invites GET] Convite não encontrado ou já usado:', code, error?.message)
            return NextResponse.json({ valid: false })
        }

        if (!data.barbershop_id) {
            // Convite de Super Admin
            return NextResponse.json({
                valid: true,
                invite: {
                    code: data.code,
                    barbershop_id: null,
                    role: data.role || 'admin',
                    is_superadmin_invite: true
                }
            })
        }

        // Buscar nome da barbearia
        const { data: barbershop } = await supabase
            .from('barbershops')
            .select('name, slug')
            .eq('id', data.barbershop_id)
            .single()

        return NextResponse.json({
            valid: true,
            invite: {
                code: data.code,
                barbershop_id: data.barbershop_id,
                barbershop_name: barbershop?.name || 'Barbearia',
                barbershop_slug: barbershop?.slug || '',
                role: data.role,
                commission: data.commission,
                permissions: data.permissions,
                is_superadmin_invite: false
            }
        })
    } catch (err: any) {
        console.error('[API /invites GET] Erro fatal:', err.message)
        return NextResponse.json({ valid: false, error: err.message }, { status: 500 })
    }
}

export async function DELETE(request: Request) {
    try {
        const supabase = createAdminClient()
        const body = await request.json()
        const { code, used_by } = body

        if (!code) {
            return NextResponse.json({ success: false, error: 'Código do convite não informado.' }, { status: 400 })
        }

        const { error } = await supabase
            .from('invites')
            .update({
                used_at: new Date().toISOString(),
                used_by: used_by || null
            })
            .eq('code', code)

        if (error) {
            console.error('[API /invites DELETE] Erro ao marcar convite como usado:', error.message)
            return NextResponse.json({ success: false, error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (err: any) {
        console.error('[API /invites DELETE] Erro fatal:', err.message)
        return NextResponse.json({ success: false, error: err.message }, { status: 500 })
    }
}
