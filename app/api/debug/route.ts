import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
    const { data, error } = await supabase.from('barbers').select('id, name, work_start, work_end, lunch_start, lunch_end, working_hours')
    return NextResponse.json({ barbers: data, error })
}
