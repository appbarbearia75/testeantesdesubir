"use client"

import { motion } from "framer-motion"
import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trash2, Plus, Save, X, Crown, Sparkles, GripVertical, TrendingUp, Users, DollarSign, Calendar as CalendarIcon, ArrowUpRight, BarChart3, AlertCircle } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { VipPlan } from "@/app/data"
import { 
    LineChart, 
    Line, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer,
    BarChart,
    Bar,
    Cell
} from 'recharts'
import { format, subDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, parseISO, startOfMonth, endOfMonth, eachMonthOfInterval, isSameMonth } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core'
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// Sortable Row Component
function SortableRow({
    id,
    plan,
    onDelete,
    onEdit,
    onSelect
}: {
    id: string,
    plan: VipPlan,
    onDelete: (id: string) => void,
    onEdit: (plan: VipPlan) => void,
    onSelect?: (plan: VipPlan) => void
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 1,
        position: isDragging ? 'relative' as 'relative' : undefined,
        backgroundColor: isDragging ? 'var(--border-color)' : undefined // zinc-800
    }

    const formatCurrencyInternal = (value: number) => {
        return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
        }).format(value)
    }

    return (
        <TableRow
            ref={setNodeRef}
            style={style}
            className="border-[var(--border-color)] hover:bg-[var(--bg-card)]/50 group cursor-pointer md:cursor-default"
            onClick={() => {
                if (window.innerWidth < 1024 && onSelect) {
                    onSelect(plan)
                }
            }}
        >
            <TableCell className="w-[30px] sm:w-[40px] px-1 sm:px-4">
                <div {...attributes} {...listeners} className="cursor-grab hover:text-[var(--text-primary)] text-[var(--text-muted)] flex items-center justify-center">
                    <GripVertical className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
            </TableCell>
            <TableCell className="px-1 sm:px-4 max-w-[120px] sm:max-w-none">
                <div className="font-bold text-xs sm:text-base leading-tight truncate flex items-center gap-1 sm:gap-2">
                    {plan.title}
                    {plan.highlight_text && <span className="hidden lg:inline-block text-[10px] bg-[#DBC278]/20 text-[#DBC278] px-1.5 py-0.5 rounded uppercase">{plan.highlight_text}</span>}
                </div>
                <div className="md:hidden mt-1 text-[8px] text-[#DBC278]/80 font-bold uppercase tracking-wider">
                    {plan.highlight_text}
                </div>
                <div className="hidden sm:block text-xs text-[var(--text-muted)] truncate mt-0.5">{plan.description}</div>
            </TableCell>
            <TableCell className="px-1 sm:px-4 w-[70px] sm:w-auto">
                <div className="text-[10px] sm:text-sm font-bold whitespace-nowrap">R$ {Number(plan.price).toFixed(2)}</div>
                {plan.price_from && (
                    <div className="text-[8px] text-[var(--text-muted)] line-through sm:hidden whitespace-nowrap mt-0.5">R$ {Number(plan.price_from).toFixed(2)}</div>
                )}
            </TableCell>
            <TableCell className="hidden sm:table-cell px-2 sm:px-4 whitespace-nowrap text-sm text-[var(--text-muted)]">
                {plan.price_from ? `R$ ${Number(plan.price_from).toFixed(2)}` : "-"}
            </TableCell>
            <TableCell className="text-right px-1 sm:px-4 w-[60px] sm:w-auto">
                <div className="flex justify-end pr-1 gap-0 sm:gap-1">
                    <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 sm:h-8 sm:w-auto px-1 sm:px-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/10 opacity-100 sm:opacity-50 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => { e.stopPropagation(); onEdit(plan); }}
                    >
                        <span className="hidden sm:inline">Editar</span>
                        <Save className="w-3.5 h-3.5 sm:hidden" />
                    </Button>
                    <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 sm:h-8 sm:w-8 text-red-400 hover:text-red-300 hover:bg-red-500/10 opacity-100 sm:opacity-50 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => { e.stopPropagation(); onDelete(plan.id); }}
                    >
                        <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </Button>
                </div>
            </TableCell>
        </TableRow>
    )
}

export default function VipConfigPage() {
    const params = useParams()
    const slug = params.slug as string
    const [plans, setPlans] = useState<VipPlan[]>([])
    const [loading, setLoading] = useState(true)
    const [isCreating, setIsCreating] = useState(false)
    const [selectedPlan, setSelectedPlan] = useState<VipPlan | null>(null)
    const [newPlan, setNewPlan] = useState({
        title: "",
        highlight_text: "",
        price: "",
        price_from: "",
        description: "",
    })
    const [editingId, setEditingId] = useState<string | null>(null)
    const [hasUnsavedOrder, setHasUnsavedOrder] = useState(false)

    // Dashboard State
    const [dashboardData, setDashboardData] = useState({
        totalRevenue: 0,
        activeVips: 0,
        planDistribution: [] as any[],
        revenueHistory: [] as any[]
    })
    const [statsPeriod, setStatsPeriod] = useState<'week' | 'month' | 'year'>('week')
    const [isStatsLoading, setIsStatsLoading] = useState(false)

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    useEffect(() => {
        fetchPlans()
        fetchDashboardData()
    }, [slug, statsPeriod])

    const fetchDashboardData = async () => {
        setIsStatsLoading(true)
        const { data: barbershop } = await supabase.from('barbershops').select('id').eq('slug', slug).single()
        if (!barbershop) return

        // 1. Fetch Clients with their VIP Plan
        const { data: clients } = await supabase
            .from('clients')
            .select('id, is_vip, vip_since, vip_plan_id, created_at')
            .eq('barbershop_id', barbershop.id)
            .eq('is_vip', true)

        if (!clients) return

        // 2. Fetch all VIP Plans context
        const { data: allPlans } = await supabase
            .from('vip_plans')
            .select('id, title, price')
            .eq('barbershop_id', barbershop.id)

        const plansMap = new Map(allPlans?.map(p => [p.id, p]))

        // 3. Calculate KPIs
        let totalRevenue = 0
        const distributionMap = new Map<string, number>()
        
        clients.forEach(client => {
            const plan = plansMap.get(client.vip_plan_id)
            if (plan) {
                totalRevenue += Number(plan.price)
                distributionMap.set(plan.title, (distributionMap.get(plan.title) || 0) + 1)
            }
        })

        // 4. Plan Distribution data for chart
        const planDistribution = Array.from(distributionMap.entries()).map(([name, value]) => ({
            name,
            value
        })).sort((a, b) => b.value - a.value)

        // 5. Revenue History (Mocking/Calculating based on vip_since)
        // Since we don't have historical "snapshots", we'll simulate revenue based on when clients joined
        const history: any[] = []
        const now = new Date()

        if (statsPeriod === 'week') {
            const start = startOfWeek(now, { locale: ptBR })
            const end = endOfWeek(now, { locale: ptBR })
            const days = eachDayOfInterval({ start, end })

            days.forEach(day => {
                const dayRevenue = clients
                    .filter(c => c.vip_since ? new Date(c.vip_since) <= day : new Date(c.created_at) <= day)
                    .reduce((acc, c) => acc + Number(plansMap.get(c.vip_plan_id)?.price || 0), 0)
                
                history.push({
                    name: format(day, 'EEE', { locale: ptBR }),
                    revenue: dayRevenue
                })
            })
        } else if (statsPeriod === 'month') {
            // Last 30 days
            for (let i = 29; i >= 0; i--) {
                const day = subDays(now, i)
                const dayRevenue = clients
                    .filter(c => c.vip_since ? new Date(c.vip_since) <= day : new Date(c.created_at) <= day)
                    .reduce((acc, c) => acc + Number(plansMap.get(c.vip_plan_id)?.price || 0), 0)
                
                history.push({
                    name: format(day, 'dd/MM'),
                    revenue: dayRevenue
                })
            }
        } else {
            // Last 12 months
            const start = subDays(now, 365)
            const months = eachMonthOfInterval({ start, end: now })
            
            months.forEach(month => {
                const monthRevenue = clients
                    .filter(c => c.vip_since ? new Date(c.vip_since) <= endOfMonth(month) : new Date(c.created_at) <= endOfMonth(month))
                    .reduce((acc, c) => acc + Number(plansMap.get(c.vip_plan_id)?.price || 0), 0)
                
                history.push({
                    name: format(month, 'MMM', { locale: ptBR }),
                    revenue: monthRevenue
                })
            })
        }

        setDashboardData({
            totalRevenue,
            activeVips: clients.length,
            planDistribution,
            revenueHistory: history
        })
        setIsStatsLoading(false)
    }

    const fetchPlans = async () => {
        setLoading(true)
        const { data: barbershop } = await supabase.from('barbershops').select('id').eq('slug', slug).single()

        if (barbershop) {
            const { data } = await supabase
                .from('vip_plans')
                .select('*')
                .eq('barbershop_id', barbershop.id)
                .order('position', { ascending: true })
                .order('created_at', { ascending: true })

            if (data) setPlans(data)
        }
        setLoading(false)
    }

    const formatCurrency = (value: string) => {
        const numericValue = value.replace(/\D/g, "")
        const amount = Number(numericValue) / 100
        return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
        }).format(amount)
    }

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event

        if (active.id !== over?.id) {
            setPlans((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id)
                const newIndex = items.findIndex((item) => item.id === over?.id)
                return arrayMove(items, oldIndex, newIndex)
            })
            setHasUnsavedOrder(true)
        }
    }

    const saveOrder = async () => {
        setLoading(true)
        const updates = plans.map((plan, index) => ({
            id: plan.id,
            position: index
        }))

        await Promise.all(updates.map(u =>
            supabase.from('vip_plans').update({ position: u.position }).eq('id', u.id)
        ))

        setHasUnsavedOrder(false)
        setLoading(false)
    }

    const handleCreateOrUpdate = async () => {
        if (!newPlan.title || !newPlan.price) return

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const priceNumeric = Number(newPlan.price.replace(/\D/g, "")) / 100
            const priceFromNumeric = newPlan.price_from ? Number(newPlan.price_from.replace(/\D/g, "")) / 100 : null

            if (editingId) {
                // Atualizar plano existente
                const { error } = await supabase.from('vip_plans').update({
                    title: newPlan.title,
                    highlight_text: newPlan.highlight_text || null,
                    price: priceNumeric,
                    price_from: priceFromNumeric,
                    description: newPlan.description,
                }).eq('id', editingId)

                if (error) throw error
            } else {
                // Criar novo plano
                const maxPosition = plans.length > 0 ? Math.max(...plans.map(p => p.position || 0)) : 0

                const { error } = await supabase.from('vip_plans').insert([
                    {
                        barbershop_id: user.id,
                        title: newPlan.title,
                        highlight_text: newPlan.highlight_text || null,
                        price: priceNumeric,
                        price_from: priceFromNumeric,
                        description: newPlan.description,
                        position: maxPosition + 1
                    }
                ])

                if (error) throw error
            }

            setNewPlan({ title: "", highlight_text: "", price: "", price_from: "", description: "" })
            setIsCreating(false)
            setEditingId(null)
            fetchPlans()

        } catch (error) {
            console.error("Error creating/updating VIP plan:", error)
            alert("Erro ao salvar plano VIP.")
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Tem certeza que deseja excluir este plano VIP?")) return

        const { error } = await supabase.from('vip_plans').delete().eq('id', id)
        if (!error) fetchPlans()
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
                        <Crown className="w-6 h-6 sm:w-8 sm:h-8 text-[#DBC278]" />
                        Planos VIP
                    </h1>
                    <p className="text-[var(--text-secondary)] text-sm sm:text-base">Gerencie os planos de assinatura.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    {hasUnsavedOrder && (
                        <Button onClick={saveOrder} className="bg-green-600 hover:bg-green-500 text-white font-bold animate-in fade-in zoom-in h-10 sm:h-11">
                            <Save className="w-4 h-4 mr-2" />
                            Salvar Ordem
                        </Button>
                    )}
                    <Button
                        onClick={() => {
                            setEditingId(null)
                            setNewPlan({ title: "", highlight_text: "", price: "", price_from: "", description: "" })
                            setIsCreating(true)
                        }}
                        className="bg-[#DBC278] hover:bg-[#c9b06b] text-black font-bold h-10 sm:h-11 flex-1 sm:flex-none"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Novo Plano
                    </Button>
                </div>
            </div>

            <Dialog open={isCreating} onOpenChange={setIsCreating}>
                <DialogContent className="bg-[var(--bg-page)] border-[#DBC278]/20 text-[var(--text-primary)] shadow-[0_0_50px_rgba(219,194,120,0.15)] sm:max-w-[600px] overflow-hidden">
                    {/* Background glow effect for VIP look */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[150%] h-32 bg-[#DBC278]/10 blur-[50px] pointer-events-none" />

                    <DialogHeader className="relative z-10">
                        <DialogTitle className="text-2xl font-black flex items-center gap-2">
                            {editingId ? (
                                <>Editar Plano <span className="text-[#DBC278]">VIP</span></>
                            ) : (
                                <>Novo Plano <span className="text-[#DBC278]">VIP</span></>
                            )}
                            <Sparkles className="w-4 h-4 text-[#DBC278]" />
                        </DialogTitle>
                        <DialogDescription className="text-[var(--text-secondary)]">
                            Configure os detalhes do plano de assinatura.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="relative z-10 grid gap-6 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[var(--text-secondary)]">Nome do Plano</Label>
                                <Input
                                    placeholder="ex: VIP Black"
                                    value={newPlan.title}
                                    onChange={(e) => setNewPlan(prev => ({ ...prev, title: e.target.value }))}
                                    className="bg-[var(--bg-card)] border-white/10 focus-visible:ring-[#DBC278]/50"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[var(--text-secondary)]">Texto Destaque (Cards)</Label>
                                <Input
                                    placeholder="ex: Cortes Ilimitados"
                                    value={newPlan.highlight_text}
                                    onChange={(e) => setNewPlan(prev => ({ ...prev, highlight_text: e.target.value }))}
                                    className="bg-[var(--bg-card)] border-white/10 focus-visible:ring-[#DBC278]/50"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[var(--text-secondary)]">Preço Mensal</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] font-medium">R$</span>
                                    <Input
                                        placeholder="0,00"
                                        value={newPlan.price.replace(/^R\$\s*/i, "").trim()}
                                        onChange={(e) => {
                                            const formatted = formatCurrency(e.target.value)
                                            setNewPlan(prev => ({ ...prev, price: formatted }))
                                        }}
                                        className="bg-[var(--bg-card)] border-white/10 focus-visible:ring-[#DBC278]/50 pl-9 font-bold text-[#DBC278]"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[var(--text-secondary)]">Preço Original (Riscado)</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] font-medium">R$</span>
                                    <Input
                                        placeholder="Opcional"
                                        value={newPlan.price_from.replace(/^R\$\s*/i, "").trim()}
                                        onChange={(e) => {
                                            const formatted = formatCurrency(e.target.value)
                                            setNewPlan(prev => ({ ...prev, price_from: formatted }))
                                        }}
                                        className="bg-[var(--bg-card)] border-white/10 focus-visible:ring-[#DBC278]/50 pl-9 text-[var(--text-secondary)]"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[var(--text-secondary)]">Descrição / Benefícios Curtos</Label>
                            <Input
                                placeholder="ex: Tenha acesso livre à barbearia..."
                                value={newPlan.description}
                                onChange={(e) => setNewPlan(prev => ({ ...prev, description: e.target.value }))}
                                className="bg-[var(--bg-card)] border-white/10 focus-visible:ring-[#DBC278]/50"
                            />
                        </div>
                    </div>

                    <DialogFooter className="relative z-10 border-t border-white/5 pt-4">
                        <Button
                            variant="ghost"
                            onClick={() => setIsCreating(false)}
                            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5"
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleCreateOrUpdate}
                            className="bg-[#DBC278] hover:bg-[#c9b06b] text-black font-bold shadow-[0_0_15px_rgba(219,194,120,0.3)] transition-all"
                        >
                            <Save className="w-4 h-4 mr-2" />
                            {editingId ? "Salvar Alterações" : "Criar Plano"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Card className="bg-[var(--bg-card)] border-white/5 text-[var(--text-primary)] shadow-2xl shadow-black/50">
                <CardContent className="p-0">
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <Table>
                            <TableHeader>
                                <TableRow className="border-[var(--border-color)] hover:bg-[var(--bg-card)]/50">
                                    <TableHead className="w-[40px] px-2 sm:px-4"></TableHead>
                                    <TableHead className="text-[var(--text-secondary)] px-2 sm:px-4 text-xs sm:text-sm">Plano</TableHead>
                                    <TableHead className="text-[var(--text-secondary)] px-2 sm:px-4 text-xs sm:text-sm">Preço</TableHead>
                                    <TableHead className="text-[var(--text-secondary)] px-2 sm:px-4 hidden sm:table-cell text-sm">De (Original)</TableHead>
                                    <TableHead className="text-right text-[var(--text-secondary)] px-2 sm:px-4 text-xs sm:text-sm pr-4">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                <SortableContext
                                    items={plans.map(p => p.id)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8">Carregando...</TableCell>
                                        </TableRow>
                                    ) : plans.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8 text-[var(--text-muted)]">Nenhum plano VIP cadastrado.</TableCell>
                                        </TableRow>
                                    ) : (
                                        plans.map((plan) => (
                                            <SortableRow
                                                key={plan.id}
                                                id={plan.id}
                                                plan={plan}
                                                onDelete={handleDelete}
                                                onSelect={setSelectedPlan}
                                                onEdit={(p) => {
                                                    setEditingId(p.id)
                                                    setNewPlan({
                                                        title: p.title,
                                                        highlight_text: p.highlight_text || "",
                                                        price: formatCurrency(Number(p.price).toFixed(2).replace(/\D/g, "")),
                                                        price_from: p.price_from ? formatCurrency(Number(p.price_from).toFixed(2).replace(/\D/g, "")) : "",
                                                        description: p.description || ""
                                                    })
                                                    setIsCreating(true)
                                                }}
                                            />
                                        ))
                                    )}
                                </SortableContext>
                            </TableBody>
                        </Table>
                    </DndContext>
                </CardContent>
            </Card>

            {/* Dashboard Analítico VIP */}
            <div className="pt-8 border-t border-[var(--border-color)]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                        <h2 className="text-2xl font-black flex items-center gap-2">
                            <TrendingUp className="w-6 h-6 text-[#DBC278]" />
                            Visão Geral <span className="text-[#DBC278]">VIP</span>
                        </h2>
                        <p className="text-[var(--text-muted)] text-sm">Acompanhe métricas de faturamento e engajamento dos planos.</p>
                    </div>

                    <div className="flex bg-[var(--bg-page)]/50 p-1 rounded-xl border border-[var(--border-color)]">
                        {(['week', 'month', 'year'] as const).map((p) => (
                            <button
                                key={p}
                                onClick={() => setStatsPeriod(p)}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                    statsPeriod === p 
                                    ? 'bg-[#DBC278] text-black shadow-lg shadow-[#DBC278]/20' 
                                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                                }`}
                            >
                                {p === 'week' ? 'Semana' : p === 'month' ? 'Mês' : 'Ano'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <Card className="bg-[var(--bg-card)] border-[var(--border-color)] shadow-xl overflow-hidden relative group">
                        <div className="absolute bottom-0 right-0 p-2 sm:p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <DollarSign className="w-12 h-12 sm:w-16 sm:h-16 text-[#DBC278]" />
                        </div>
                        <CardHeader className="pb-1 sm:pb-2 p-4">
                            <CardTitle className="text-[var(--text-muted)] text-[10px] sm:text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                                <DollarSign className="w-3 h-3" />
                                Faturamento VIP (MRR)
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <div className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] flex items-baseline gap-1">
                                <span className="text-xs sm:text-sm text-[#DBC278]">R$</span>
                                {dashboardData.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                            <div className="flex items-center gap-1 mt-1 sm:mt-2 text-[8px] sm:text-[10px] font-bold text-green-500 uppercase">
                                <ArrowUpRight className="w-3 h-3" />
                                Receita Previsível
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-[var(--bg-card)] border-[var(--border-color)] shadow-xl overflow-hidden relative group">
                        <div className="absolute bottom-0 right-0 p-2 sm:p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Users className="w-12 h-12 sm:w-16 sm:h-16 text-[#DBC278]" />
                        </div>
                        <CardHeader className="pb-1 sm:pb-2 p-4">
                            <CardTitle className="text-[var(--text-muted)] text-[10px] sm:text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                                <Users className="w-3 h-3" />
                                Clientes VIP Ativos
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <div className="text-2xl sm:text-3xl font-black text-[var(--text-primary)]">
                                {dashboardData.activeVips}
                            </div>
                            <p className="text-[8px] sm:text-[10px] text-[var(--text-muted)] font-bold uppercase mt-1 sm:mt-2">
                                Assinantes recorrentes
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Gráfico Principal de Faturamento */}
                    <Card className="lg:col-span-2 bg-[var(--bg-card)] border-[var(--border-color)] shadow-xl p-6">
                        <h3 className="text-sm font-bold text-[var(--text-secondary)] flex items-center gap-2 mb-6 uppercase tracking-wider">
                            <BarChart3 className="w-4 h-4 text-[#DBC278]" />
                            Evolução do Faturamento
                        </h3>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={dashboardData.revenueHistory}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                                    <XAxis 
                                        dataKey="name" 
                                        stroke="#52525b" 
                                        fontSize={10} 
                                        tickLine={false} 
                                        axisLine={false}
                                        dy={10}
                                    />
                                    <YAxis 
                                        stroke="#52525b" 
                                        fontSize={10} 
                                        tickLine={false} 
                                        axisLine={false}
                                        tickFormatter={(val) => `R$ ${val}`}
                                    />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                                        itemStyle={{ color: '#DBC278', fontWeight: 'bold' }}
                                        labelStyle={{ color: '#white', marginBottom: '4px', fontWeight: 'bold' }}
                                        formatter={(val) => [`R$ ${Number(val).toFixed(2)}`, 'Faturamento']}
                                    />
                                    <Line 
                                        type="monotone" 
                                        dataKey="revenue" 
                                        stroke="#DBC278" 
                                        strokeWidth={3} 
                                        dot={{ fill: '#DBC278', strokeWidth: 2, r: 4 }}
                                        activeDot={{ r: 6, strokeWidth: 0 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>

                    {/* Ranking de Planos */}
                    <Card className="bg-[var(--bg-card)] border-[var(--border-color)] shadow-xl p-6">
                        <h3 className="text-sm font-bold text-[var(--text-secondary)] flex items-center gap-2 mb-6 uppercase tracking-wider">
                            <Crown className="w-4 h-4 text-[#DBC278]" />
                            Planos Populares
                        </h3>
                        {dashboardData.planDistribution.length > 0 ? (
                            <div className="space-y-6">
                                {dashboardData.planDistribution.map((item, idx) => (
                                    <div key={item.name} className="space-y-2">
                                        <div className="flex justify-between items-end">
                                            <span className="text-xs font-black text-[var(--text-primary)] uppercase tracking-tight">
                                                {idx + 1}. {item.name}
                                            </span>
                                            <span className="text-xs font-bold text-[#DBC278]">
                                                {item.value} {item.value === 1 ? 'assinante' : 'assinantes'}
                                            </span>
                                        </div>
                                        <div className="h-2 w-full bg-[var(--bg-card)] rounded-full overflow-hidden">
                                            <motion.div 
                                                initial={{ width: 0 }}
                                                animate={{ width: `${(item.value / Math.max(...dashboardData.planDistribution.map(d => d.value))) * 100}%` }}
                                                transition={{ duration: 1, delay: idx * 0.1 }}
                                                className="h-full bg-gradient-to-r from-[#DBC278] to-[#c9b06b] shadow-[0_0_10px_rgba(219,194,120,0.3)]"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-[200px] text-[var(--text-muted)]">
                                <AlertCircle className="w-8 h-8 mb-2 opacity-20" />
                                <p className="text-xs font-bold uppercase">Nenhuma assinatura ativa</p>
                            </div>
                        )}
                    </Card>
                </div>
            </div>

            {/* Mobile Plan Details Modal */}
            <Dialog open={!!selectedPlan} onOpenChange={(open) => !open && setSelectedPlan(null)}>
                {selectedPlan && (
                    <DialogContent className="bg-[var(--bg-page)] border-[#DBC278]/20 text-[var(--text-primary)] shadow-[0_0_50px_rgba(219,194,120,0.15)] sm:max-w-[400px]">
                        <DialogHeader>
                            <DialogTitle className="text-xl flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                    <Crown className="w-5 h-5 text-[#DBC278]" />
                                    {selectedPlan.title}
                                </div>
                                {selectedPlan.highlight_text && (
                                    <span className="text-[10px] bg-[#DBC278]/20 text-[#DBC278] w-fit px-2 py-0.5 rounded uppercase font-bold tracking-wider">
                                        {selectedPlan.highlight_text}
                                    </span>
                                )}
                            </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="bg-[var(--bg-card)] p-4 rounded-xl border border-white/5 space-y-2 relative overflow-hidden">
                                <Sparkles className="absolute right-[-10px] bottom-[-10px] w-20 h-20 text-[#DBC278]/5 pointer-events-none" />
                                <div className="flex justify-between items-end">
                                    <div>
                                        <span className="block text-xs uppercase font-bold text-[var(--text-muted)] mb-1">Valor do Plano</span>
                                        <span className="text-3xl font-black text-[#DBC278]">R$ {Number(selectedPlan.price).toFixed(2)}</span>
                                    </div>
                                    {selectedPlan.price_from && (
                                        <div className="text-right">
                                            <span className="block text-[10px] uppercase text-[var(--text-muted)]">Valor Original</span>
                                            <span className="text-sm font-bold text-[var(--text-muted)] line-through decoration-red-500/50">R$ {Number(selectedPlan.price_from).toFixed(2)}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {selectedPlan.description && (
                                <div>
                                    <span className="block text-xs uppercase font-bold text-[var(--text-muted)] mb-1">Descrição / Benefícios</span>
                                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{selectedPlan.description}</p>
                                </div>
                            )}

                            <div className="flex flex-col gap-3 pt-6 border-t border-white/5">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setEditingId(selectedPlan.id)
                                        setNewPlan({
                                            title: selectedPlan.title,
                                            highlight_text: selectedPlan.highlight_text || "",
                                            price: formatCurrency(Number(selectedPlan.price).toFixed(2).replace(/\D/g, "")),
                                            price_from: selectedPlan.price_from ? formatCurrency(Number(selectedPlan.price_from).toFixed(2).replace(/\D/g, "")) : "",
                                            description: selectedPlan.description || ""
                                        })
                                        setSelectedPlan(null)
                                        setIsCreating(true)
                                    }}
                                    className="w-full h-12 border-white/10 text-[var(--text-primary)] hover:bg-white/5"
                                >
                                    Editar Detalhes
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        handleDelete(selectedPlan.id)
                                        setSelectedPlan(null)
                                    }}
                                    className="w-full h-12 border-white/10 text-red-400 hover:text-red-300 hover:bg-red-900/20"
                                >
                                    Excluir Plano
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                )}
            </Dialog>
        </div>
    )
}
