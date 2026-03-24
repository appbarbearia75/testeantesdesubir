import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const slug = searchParams.get('slug')
        const search = searchParams.get('search')

        if (!slug) {
            return NextResponse.json({ error: 'Slug da barbearia é obrigatório.' }, { status: 400 })
        }

        // 1. Buscar o ID da barbearia pelo slug
        const { data: barbershop, error: bError } = await supabase
            .from('barbershops')
            .select('id')
            .eq('slug', slug)
            .single()

        if (bError || !barbershop) {
            return NextResponse.json({ error: 'Barbearia não encontrada.' }, { status: 404 })
        }

        // 2. Buscar clientes usando RPC para suporte a unaccent e busca por telefone
        const { data: clients, error: cError } = await supabase.rpc('search_clients', {
            p_barbershop_id: barbershop.id,
            p_search: search || ''
        })

        if (cError) {
            console.error("Erro ao buscar clientes via RPC:", cError)
            return NextResponse.json({ error: 'Erro ao buscar clientes.' }, { status: 500 })
        }

        return NextResponse.json(clients)

    } catch (err: any) {
        console.error("Erro na API de clientes:", err)
        return NextResponse.json({ error: 'Erro interno no servidor.' }, { status: 500 })
    }
}
