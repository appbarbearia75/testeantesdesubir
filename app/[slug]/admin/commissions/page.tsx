"use client"

import React, { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { CalendarIcon, TrendingUp, DollarSign, Percent, Copy, Check, Eye, Users, Scissors, Package, Wallet, Settings, Download, Trophy, Clock, Search, Save, Loader2, User, AlertTriangle, CalendarClock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { format, subDays, startOfMonth, endOfMonth, subMonths, startOfWeek, endOfWeek, setDate } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend, LabelList } from "recharts"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from "@/components/ui/dialog"

import { supabase } from "@/lib/supabase"

export default function CommissionsPage() {
    const params = useParams()
    const slug = params.slug as string

    const [loading, setLoading] = useState(true)
    const [data, setData] = useState<any>(null)
    const [barberFilter, setBarberFilter] = useState<string>("all")
    const [recentlyPaid, setRecentlyPaid] = useState<string[]>([])
    const [dateRange, setDateRange] = useState("thisMonth")
    const [customStart, setCustomStart] = useState("")
    const [customEnd, setCustomEnd] = useState("")
    const [barbersList, setBarbersList] = useState<any[]>([])

    const [selectedBarberDetails, setSelectedBarberDetails] = useState<any>(null)
    const [detailsModalOpen, setDetailsModalOpen] = useState(false)

    // Configuration Modal States
    const [configModalOpen, setConfigModalOpen] = useState(false)
    const [configBarbers, setConfigBarbers] = useState<any[]>([])
    const [savingConfig, setSavingConfig] = useState(false)
    const [isPaying, setIsPaying] = useState(false)
    const [payingBarberId, setPayingBarberId] = useState<string | null>(null)
    const [prevData, setPrevData] = useState<Record<string, number>>({})

    // Payment Registration Modal
    const [paymentModalOpen, setPaymentModalOpen] = useState(false)
    const [selectedPaymentBarber, setSelectedPaymentBarber] = useState<{ id: string, name: string, amount: number } | null>(null)
    const [paymentMethod, setPaymentMethod] = useState("dinheiro")

    // Vale Modal states
    const [valeModalOpen, setValeModalOpen] = useState(false)
    const [valeAmount, setValeAmount] = useState("")

    // Toast notification
    const [toast, setToast] = useState<{ name: string, amount: number } | null>(null)
    const showToast = (name: string, amount: number) => {
        setToast({ name, amount });
        setTimeout(() => setToast(null), 4000);
    }

    useEffect(() => {
        fetchBarbersList()
    }, [slug])

    useEffect(() => {
        if (dateRange === "custom" && (!customStart || !customEnd)) return;
        fetchCommissions()
    }, [slug, dateRange, barberFilter, customStart, customEnd])

    const fetchBarbersList = async () => {
        const { data: barbershop } = await supabase.from('barbershops').select('id').eq('slug', slug).single()
        if (barbershop) {
            const { data: barbers } = await supabase.from('barbers').select('id, name').eq('barbershop_id', barbershop.id).order('name')
            if (barbers) setBarbersList(barbers)
        }
    }

    const fetchCommissions = async () => {
        setLoading(true)
        try {
            const { data: barbershop } = await supabase.from('barbershops').select('id').eq('slug', slug).single()
            if (!barbershop) return

            let start = ""
            let end = ""
            const now = new Date()

            if (dateRange === "today") {
                start = format(now, 'yyyy-MM-dd')
                end = format(now, 'yyyy-MM-dd')
            } else if (dateRange === "thisWeek") {
                start = format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd')
                end = format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd')
            } else if (dateRange === "lastWeek") {
                const prevW = subDays(startOfWeek(now, { weekStartsOn: 1 }), 1)
                start = format(startOfWeek(prevW, { weekStartsOn: 1 }), 'yyyy-MM-dd')
                end = format(endOfWeek(prevW, { weekStartsOn: 1 }), 'yyyy-MM-dd')
            } else if (dateRange === "firstHalf") {
                start = format(startOfMonth(now), 'yyyy-MM-dd')
                end = format(setDate(now, 15), 'yyyy-MM-dd')
            } else if (dateRange === "secondHalf") {
                start = format(setDate(now, 16), 'yyyy-MM-dd')
                end = format(endOfMonth(now), 'yyyy-MM-dd')
            } else if (dateRange === "thisMonth") {
                start = format(startOfMonth(now), 'yyyy-MM-dd')
                end = format(endOfMonth(now), 'yyyy-MM-dd')
            } else if (dateRange === "lastMonth") {
                const prev = subMonths(now, 1)
                start = format(startOfMonth(prev), 'yyyy-MM-dd')
                end = format(endOfMonth(prev), 'yyyy-MM-dd')
            } else if (dateRange === "custom") {
                start = customStart
                end = customEnd
            }

            const queryParams = new URLSearchParams({
                barbershop_id: barbershop.id,
                startDate: start,
                endDate: end,
                barberId: barberFilter
            })

            // Compute previous period for % comparison
            let prevStart = ""
            let prevEnd = ""
            if (dateRange === "today") {
                prevStart = format(subDays(now, 1), 'yyyy-MM-dd')
                prevEnd = format(subDays(now, 1), 'yyyy-MM-dd')
            } else if (dateRange === "thisWeek") {
                const prevW = subDays(startOfWeek(now, { weekStartsOn: 1 }), 1)
                prevStart = format(startOfWeek(prevW, { weekStartsOn: 1 }), 'yyyy-MM-dd')
                prevEnd = format(endOfWeek(prevW, { weekStartsOn: 1 }), 'yyyy-MM-dd')
            } else if (dateRange === "lastWeek") {
                const prev2W = subDays(startOfWeek(subDays(startOfWeek(now, { weekStartsOn: 1 }), 1), { weekStartsOn: 1 }), 1)
                prevStart = format(startOfWeek(prev2W, { weekStartsOn: 1 }), 'yyyy-MM-dd')
                prevEnd = format(endOfWeek(prev2W, { weekStartsOn: 1 }), 'yyyy-MM-dd')
            } else if (dateRange === "firstHalf") {
                const prevM = subMonths(now, 1)
                prevStart = format(startOfMonth(prevM), 'yyyy-MM-dd')
                prevEnd = format(setDate(prevM, 15), 'yyyy-MM-dd')
            } else if (dateRange === "secondHalf") {
                const prevM = subMonths(now, 1)
                prevStart = format(setDate(prevM, 16), 'yyyy-MM-dd')
                prevEnd = format(endOfMonth(prevM), 'yyyy-MM-dd')
            } else if (dateRange === "thisMonth") {
                const prev = subMonths(now, 1)
                prevStart = format(startOfMonth(prev), 'yyyy-MM-dd')
                prevEnd = format(endOfMonth(prev), 'yyyy-MM-dd')
            } else if (dateRange === "lastMonth") {
                const prev2 = subMonths(now, 2)
                prevStart = format(startOfMonth(prev2), 'yyyy-MM-dd')
                prevEnd = format(endOfMonth(prev2), 'yyyy-MM-dd')
            } else if (dateRange === "custom" && start && end) {
                const startDt = new Date(start)
                const endDt = new Date(end)
                const diffMs = endDt.getTime() - startDt.getTime()
                const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1
                const prevEndDt = new Date(startDt)
                prevEndDt.setDate(prevEndDt.getDate() - 1)
                const prevStartDt = new Date(prevEndDt)
                prevStartDt.setDate(prevStartDt.getDate() - diffDays + 1)
                prevStart = format(prevStartDt, 'yyyy-MM-dd')
                prevEnd = format(prevEndDt, 'yyyy-MM-dd')
            }

            const prevQueryParams = prevStart ? new URLSearchParams({
                barbershop_id: barbershop.id,
                startDate: prevStart,
                endDate: prevEnd,
                barberId: barberFilter
            }) : null

            const [response, prevResponse] = await Promise.all([
                fetch(`/api/commissions?${queryParams}`),
                prevQueryParams ? fetch(`/api/commissions?${prevQueryParams}`) : Promise.resolve(null)
            ])

            const result = await response.json()
            const prevResult = prevResponse ? await prevResponse.json() : null

            if (result.error) {
                console.error(result.error)
            } else {
                setData(result)
                // Build a map: barberId -> prevRevenue
                if (prevResult && prevResult.barbers) {
                    const map: Record<string, number> = {}
                    prevResult.barbers.forEach((b: any) => { map[b.id] = b.totalRevenue })
                    setPrevData(map)
                } else {
                    setPrevData({})
                }
            }
        } catch (error) {
            console.error("Error fetching commissions:", error)
        } finally {
            setLoading(false)
        }
    }

    const openConfigModal = async () => {
        const { data: barbershop } = await supabase.from('barbershops').select('id').eq('slug', slug).single()
        if (barbershop) {
            const { data } = await supabase.from('barbers').select('id, name, commission_type, commission_value').eq('barbershop_id', barbershop.id).order('name')
            if (data) {
                const formatted = data.map((b: any) => {
                    const cType = b.commission_type || 'percentage'
                    const cVal = parseFloat(b.commission_value) || 0

                    let displayValue = ''
                    if (cType === 'percentage') {
                        displayValue = cVal.toString()
                    } else {
                        displayValue = cVal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    }
                    return { ...b, commission_type: cType, commission_value: displayValue }
                })
                setConfigBarbers(formatted)
            }
        }
        setConfigModalOpen(true)
    }

    const handleConfigTypeChange = (id: string, newType: string) => {
        setConfigBarbers(prev => prev.map(b => {
            if (b.id !== id) return b;
            return {
                ...b,
                commission_type: newType,
                commission_value: newType === 'percentage' ? '0' : '0,00'
            }
        }))
    }

    const handleConfigValueChange = (id: string, type: string, value: string) => {
        setConfigBarbers(prev => prev.map(b => {
            if (b.id !== id) return b;

            let newValue = value;
            if (type === 'percentage') {
                newValue = newValue.replace(/\D/g, '')
                if (newValue === '') newValue = '0'
                const intVal = parseInt(newValue, 10)
                if (intVal > 100) newValue = '100'
                else newValue = intVal.toString()
            } else if (type === 'fixed') {
                const numericOnly = value.replace(/\D/g, '')
                if (numericOnly === '') {
                    newValue = '0,00'
                } else {
                    const numberVal = parseInt(numericOnly, 10) / 100
                    newValue = numberVal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                }
            }
            return { ...b, commission_value: newValue }
        }))
    }

    const saveConfig = async () => {
        setSavingConfig(true)
        try {
            for (const b of configBarbers) {
                let numericValue = 0;
                if (b.commission_type === 'percentage') {
                    numericValue = parseFloat(b.commission_value) || 0;
                } else {
                    const cleaned = b.commission_value.toString().replace(/\./g, '').replace(',', '.')
                    numericValue = parseFloat(cleaned) || 0;
                }

                await supabase.from('barbers').update({
                    commission_type: b.commission_type,
                    commission_value: numericValue
                }).eq('id', b.id)
            }
            setConfigModalOpen(false)
            fetchCommissions() // refresh data immediately
        } catch (error) {
            console.error("Error saving config:", error)
            alert("Erro ao salvar configurações.")
        }
        setSavingConfig(false)
    }

    const openPaymentModal = (barberId: string, name: string, amount: number) => {
        setSelectedPaymentBarber({ id: barberId, name, amount });
        setPaymentMethod("dinheiro"); // reset default
        setPaymentModalOpen(true);
    };

    const confirmPayment = async () => {
        if (!selectedPaymentBarber) return;
        setIsPaying(true);
        setPayingBarberId(selectedPaymentBarber.id);

        try {
            const { data: barbershop } = await supabase.from('barbershops').select('id').eq('slug', slug).single()
            if (!barbershop) throw new Error("Barbearia não encontrada");

            const response = await fetch('/api/commissions/pay', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    barbershop_id: barbershop.id,
                    barber_id: selectedPaymentBarber.id,
                    amount: selectedPaymentBarber.amount,
                    method: paymentMethod
                })
            })

            if (response.ok) {
                const paidName = selectedPaymentBarber.name;
                const paidAmount = selectedPaymentBarber.amount;
                setRecentlyPaid(prev => [...prev, selectedPaymentBarber.id]);
                setTimeout(() => {
                    setRecentlyPaid(prev => prev.filter(id => id !== selectedPaymentBarber?.id))
                }, 5000);
                await fetchCommissions()
                setPaymentModalOpen(false)
                showToast(paidName, paidAmount);
            } else {
                alert("Erro ao registrar pagamento.")
            }
        } catch (error) {
            console.error("Error confirming payment:", error)
            alert("Erro ao registrar pagamento.")
        }
        setIsPaying(false);
        setPayingBarberId(null);
        setSelectedPaymentBarber(null);
    }

    const handlePayAll = () => {
        if (!selectedBarberDetails) return;
        openPaymentModal(selectedBarberDetails.id, selectedBarberDetails.name, selectedBarberDetails.totalCommission)
    }

    const submitValeDiscount = async () => {
        if (!selectedBarberDetails || !valeAmount) return;
        const v = parseFloat(valeAmount.replace(',', '.'));
        if (isNaN(v) || v <= 0) return;
        openPaymentModal(selectedBarberDetails.id, selectedBarberDetails.name, selectedBarberDetails.totalCommission - v);
    }

    const handleAbaterVale = () => {
        const numericOnly = valeAmount.replace(/\D/g, '')
        const numVal = parseInt(numericOnly, 10) / 100
        if (!numVal || numVal <= 0) return alert("Digite um valor válido.");
        openPaymentModal(selectedBarberDetails.id, selectedBarberDetails.name, numVal);
    }

    const handleValeChange = (val: string) => {
        const numericOnly = val.replace(/\D/g, '')
        if (!numericOnly) {
            setValeAmount("")
            return
        }
        let numberVal = parseInt(numericOnly, 10) / 100

        if (selectedBarberDetails && numberVal > selectedBarberDetails.totalCommission) {
            numberVal = selectedBarberDetails.totalCommission
        }

        setValeAmount(numberVal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))
    }

    const exportGeneralCSV = () => {
        if (!data || !data.barbers) return;

        const headers = ["Profissional", "Cargo", "Atendimentos", "Faturamento (R$)", "Comissao Pendente (R$)", "Comissao Paga (R$)"];
        const rows = data.barbers.map((b: any) => [
            b.name,
            b.role || "Funcionario",
            b.totalAppointments,
            b.totalRevenue.toFixed(2).replace('.', ','),
            b.totalCommission.toFixed(2).replace('.', ','),
            b.totalCommissionPaid.toFixed(2).replace('.', ',')
        ]);

        const csvContent = [
            headers.join(";"),
            ...rows.map((r: any[]) => r.join(";"))
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `comissoes_geral_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    const exportDetailedCSV = () => {
        if (!selectedBarberDetails) return;

        const headers = ["Data", "Horario", "Cliente", "Serviço", "Valor (R$)", "Comissao (R$)", "Status"];
        const rows = selectedBarberDetails.appointmentsList.map((app: any) => [
            new Date(app.date).toLocaleDateString('pt-BR'),
            app.time,
            app.clientName,
            app.service,
            app.value.toFixed(2).replace('.', ','),
            app.commission.toFixed(2).replace('.', ','),
            app.isPaid ? 'Pago' : (app.paidAmount > 0 ? 'Pago Parcial' : 'Pendente')
        ]);

        const csvContent = [
            headers.join(";"),
            ...rows.map((r: any[]) => r.join(";"))
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `comissoes_${selectedBarberDetails.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    const getPeriodText = () => {
        if (dateRange === "today") return "Hoje";
        if (dateRange === "thisWeek") return "Esta Semana";
        if (dateRange === "lastWeek") return "Semana Passada";
        if (dateRange === "firstHalf") return "1ª Quinzena (" + format(new Date(), "MMMM yyyy", { locale: ptBR }) + ")";
        if (dateRange === "secondHalf") return "2ª Quinzena (" + format(new Date(), "MMMM yyyy", { locale: ptBR }) + ")";
        if (dateRange === "thisMonth") return format(new Date(), "MMMM yyyy", { locale: ptBR });
        if (dateRange === "lastMonth") return format(subMonths(new Date(), 1), "MMMM yyyy", { locale: ptBR });
        if (dateRange === "custom") return `De ${new Date(customStart + "T12:00:00").toLocaleDateString('pt-BR')} até ${new Date(customEnd + "T12:00:00").toLocaleDateString('pt-BR')}`;
        return "";
    }

    // Loading skeleton
    const Skeleton = ({ className }: { className?: string }) => (
        <div className={`animate-pulse bg-white/5 rounded-lg ${className}`} />
    )

    return (
        <div className="space-y-5 max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">

            {/* Toast notification */}
            {toast && (
                <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4 duration-300">
                    <div className="flex items-center gap-3 bg-green-900/90 backdrop-blur-sm border border-green-500/30 rounded-xl px-4 py-3 shadow-2xl shadow-green-900/50">
                        <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center shrink-0">
                            <Check className="w-4 h-4 text-green-400" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-green-300">Pagamento registrado</p>
                            <p className="text-xs text-green-400/70">{toast.name} recebeu {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(toast.amount)}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* === HEADER === */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[var(--bg-card)]/80 backdrop-blur-sm flex items-center justify-center border border-white/[0.06]">
                        <DollarSign className="w-4 h-4 text-[var(--text-secondary)]" />
                    </div>
                    <div>
                        <h1 className="text-lg font-semibold text-[var(--text-primary)]">Comissões</h1>
                        <p className="text-[var(--text-muted)] text-xs mt-0.5 flex items-center gap-1.5 capitalize">
                            <CalendarClock className="w-3 h-3" />
                            {getPeriodText()}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                    {dateRange === "custom" && (
                        <div className="flex items-center gap-1.5">
                            <Input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="bg-[var(--bg-page)] border-[var(--border-color)] w-[115px] sm:w-[130px] text-xs h-8 transition-all duration-200 focus:border-zinc-600" />
                            <span className="text-[var(--text-muted)] text-xs text-center shrink-0">a</span>
                            <Input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="bg-[var(--bg-page)] border-[var(--border-color)] w-[115px] sm:w-[130px] text-xs h-8 transition-all duration-200 focus:border-zinc-600" />
                        </div>
                    )}
                    <Select value={dateRange} onValueChange={setDateRange}>
                        <SelectTrigger className="h-8 text-xs bg-[var(--bg-page)] border-[var(--border-color)] hover:border-[var(--border-color)] flex-1 sm:flex-none sm:w-[135px] gap-1 transition-all duration-200">
                            <CalendarIcon className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
                            <SelectValue placeholder="Período" />
                        </SelectTrigger>
                        <SelectContent className="bg-[var(--bg-page)] border-[var(--border-color)] text-[var(--text-primary)] text-sm">
                            <SelectItem value="today">Hoje</SelectItem>
                            <SelectItem value="thisWeek">Esta Semana</SelectItem>
                            <SelectItem value="lastWeek">Semana Passada</SelectItem>
                            <SelectItem value="firstHalf">1ª Quinzena</SelectItem>
                            <SelectItem value="secondHalf">2ª Quinzena</SelectItem>
                            <SelectItem value="thisMonth">Este Mês</SelectItem>
                            <SelectItem value="lastMonth">Mês Passado</SelectItem>
                            <SelectItem value="custom">Personalizado</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={barberFilter} onValueChange={setBarberFilter}>
                        <SelectTrigger className="h-8 text-xs bg-[var(--bg-page)] border-[var(--border-color)] hover:border-[var(--border-color)] flex-1 sm:flex-none sm:w-[170px] gap-1 transition-all duration-200">
                            <User className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
                            <SelectValue placeholder="Todos" />
                        </SelectTrigger>
                        <SelectContent className="bg-[var(--bg-page)] border-[var(--border-color)] text-[var(--text-primary)] text-sm max-h-[300px]">
                            <SelectItem value="all">Todos profissionais</SelectItem>
                            {barbersList.map(b => (
                                <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button variant="ghost" size="sm" className="h-8 text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] border border-[var(--border-color)] hover:border-[var(--border-color)] px-2.5 transition-all duration-200" onClick={openConfigModal}>
                        <Settings className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] border border-[var(--border-color)] hover:border-[var(--border-color)] px-2.5 transition-all duration-200" onClick={exportGeneralCSV} disabled={loading || !data}>
                        <Download className="w-3.5 h-3.5" />
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="space-y-4">
                    <div className="bg-[var(--bg-page)] border border-white/5 rounded-2xl p-8">
                        <Skeleton className="h-4 w-40 mb-4" />
                        <Skeleton className="h-10 w-48 mb-6" />
                        <Skeleton className="h-10 w-32 rounded-lg" />
                    </div>
                    <div className="space-y-2">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="bg-[var(--bg-page)] border border-white/5 rounded-xl p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Skeleton className="w-9 h-9 rounded-full" />
                                    <Skeleton className="h-3 w-24" />
                                </div>
                                <div className="flex items-center gap-4">
                                    <Skeleton className="h-5 w-20" />
                                    <Skeleton className="h-8 w-20 rounded-lg" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : !data ? (
                <div className="text-center py-20 text-[var(--text-muted)] bg-[var(--bg-card)]/50 rounded-2xl border border-white/5">
                    Não foi possível carregar os dados.
                </div>
            ) : (
                <>
                    {/* =========================================== */}
                    {/* BLOCO A — AÇÃO: HERO + LISTA DE PAGAMENTOS  */}
                    {/* =========================================== */}

                    {/* HERO CARD — Senso de urgência */}
                    {(() => {
                        const pendingBarbers = data.barbers.filter((b: any) => b.totalCommission > 0);
                        const totalPending = pendingBarbers.reduce((acc: number, b: any) => acc + b.totalCommission, 0);
                        const hasPending = totalPending > 0;
                        const hasOverdue = pendingBarbers.some((b: any) => {
                            const oldest = b.appointmentsList?.find((a: any) => !a.isPaid);
                            return oldest && Math.floor((new Date().getTime() - new Date(oldest.date).getTime()) / (1000 * 3600 * 24)) >= 5;
                        });

                        return (
                            <div className={`relative rounded-xl border overflow-hidden backdrop-blur-sm ${hasOverdue ? 'border-red-500/15 bg-[var(--bg-page)]/90' : hasPending ? 'border-white/[0.06] bg-[var(--bg-page)]/90' : 'border-white/[0.06] bg-[var(--bg-page)]/90'}`} style={{ boxShadow: '0 0 40px rgba(0,0,0,0.3)' }}>
                                {/* Ambient light */}
                                <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full opacity-[0.04] pointer-events-none" style={{ background: hasOverdue ? 'radial-gradient(circle, rgba(239,68,68,1) 0%, transparent 70%)' : hasPending ? 'radial-gradient(circle, rgba(250,204,21,1) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(34,197,94,1) 0%, transparent 70%)' }} />
                                <div className="px-5 py-5 sm:px-6 sm:py-6 relative">
                                    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                                        <div>
                                            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest font-medium mb-2">
                                                {hasPending ? 'Total a pagar' : 'Situação atual'}
                                            </p>
                                            <p className={`text-3xl sm:text-4xl font-black tabular-nums tracking-tight leading-none transition-colors duration-300 ${hasOverdue ? 'text-red-400' : hasPending ? 'text-[var(--text-primary)]' : 'text-green-400'}`}>
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalPending)}
                                            </p>
                                            <p className="text-xs text-[var(--text-muted)] mt-2 flex items-center gap-2">
                                                {hasPending ? (
                                                    <>
                                                        {hasOverdue && <AlertTriangle className="w-3.5 h-3.5 text-red-400" />}
                                                        <span>{pendingBarbers.length} profissional{pendingBarbers.length > 1 ? 'is' : ''} aguardando pagamento</span>
                                                    </>
                                                ) : 'Todas as comissões foram acertadas'}
                                            </p>
                                        </div>
                                        {hasPending && (
                                            <Button
                                                size="default"
                                                className={`font-bold text-sm px-6 h-10 transition-all duration-300 ease-out hover:scale-[1.03] active:scale-[0.97] rounded-lg w-full sm:w-auto ${hasOverdue ? 'bg-red-500 hover:bg-red-400 text-white' : 'bg-yellow-400 hover:bg-yellow-300 text-black'}`}
                                                style={{ boxShadow: hasOverdue ? '0 0 20px rgba(239,68,68,0.2)' : '0 0 20px rgba(250,204,21,0.2)' }}
                                                onClick={() => pendingBarbers.forEach((b: any) => openPaymentModal(b.id, b.name, b.totalCommission))}
                                            >
                                                <Wallet className="w-5 h-5 mr-2.5" />
                                                Finalizar pagamentos
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                {/* KPI strip */}
                                <div className="grid grid-cols-3 border-t border-white/[0.04] divide-x divide-white/[0.04] relative">
                                    <div className="px-4 py-3 sm:px-6">
                                        <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-medium mb-0.5">Comissão total</p>
                                        <p className="text-sm font-semibold text-[var(--text-secondary)] tabular-nums">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.summary.totalCommissionsGenerated)}</p>
                                    </div>
                                    <div className="px-4 py-3 sm:px-6">
                                        <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-medium mb-0.5">Faturamento</p>
                                        <p className="text-sm font-semibold text-[var(--text-secondary)] tabular-nums">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.summary.totalRevenue)}</p>
                                    </div>
                                    <div className="px-4 py-3 sm:px-6">
                                        <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-medium mb-0.5">Margem líquida</p>
                                        <p className="text-sm font-semibold text-green-400 tabular-nums">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.summary.estimatedMargin)}</p>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}

                    {/* ═══ GRID: PROFISSIONAIS + RANKING ═══ */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    {/* COLUNA ESQUERDA: LISTA */}
                    <div className="lg:col-span-2 space-y-2.5">
                        <p className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-widest px-1">Profissionais</p>
                        {data.barbers.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-[var(--text-muted)] bg-[var(--bg-page)] rounded-xl border border-white/5">
                                <Scissors className="w-8 h-8 opacity-30 mb-3" />
                                <p className="text-sm font-semibold text-[var(--text-primary)] mb-1">Nenhuma comissão gerada</p>
                                <p className="text-xs text-center px-6">Registre atendimentos na agenda para gerar comissões.</p>
                            </div>
                        ) : data.barbers.map((barber: any, barberIndex: number) => {
                            const totalGenerated = barber.totalCommission + barber.totalCommissionPaid;
                            const oldestUnpaid = barber.appointmentsList?.find((a: any) => !a.isPaid);
                            const daysPending = oldestUnpaid
                                ? Math.floor((new Date().getTime() - new Date(oldestUnpaid.date).getTime()) / (1000 * 3600 * 24))
                                : 0;
                            const isOverdue = daysPending >= 5;

                            // Status
                            let statusText = "Sem comissão";
                            let statusColor = "text-[var(--text-muted)] bg-zinc-500/10 border-zinc-500/20";
                            let statusDot = "bg-zinc-500";
                            if (barber.totalCommission === 0 && barber.totalCommissionPaid > 0) {
                                statusText = "✅ Pago"; statusColor = "text-green-400 bg-green-500/10 border-green-500/20"; statusDot = "bg-green-400";
                            } else if (barber.totalCommission > 0 && barber.totalCommissionPaid > 0) {
                                statusText = "Parcial"; statusColor = "text-blue-400 bg-blue-500/10 border-blue-500/20"; statusDot = "bg-blue-400";
                            } else if (barber.totalCommission > 0 && isOverdue) {
                                statusText = "⚠ Atrasado"; statusColor = "text-red-400 bg-red-500/10 border-red-500/20"; statusDot = "bg-red-400 animate-pulse";
                            } else if (barber.totalCommission > 0) {
                                statusText = "Pendente"; statusColor = "text-amber-400 bg-amber-400/10 border-amber-400/20"; statusDot = "bg-amber-400";
                            }

                            return (
                                <div key={barber.id} className={`bg-[var(--bg-page)]/80 backdrop-blur-sm border rounded-xl transition-all duration-300 ease-out hover:scale-[1.01] hover:-translate-y-0.5 animate-in fade-in slide-in-from-bottom-3 fill-mode-both ${isOverdue ? 'border-red-500/15 hover:border-red-500/25' : 'border-white/[0.06] hover:border-yellow-400/15'}`} style={{ boxShadow: '0 0 25px rgba(0,0,0,0.15)', animationDuration: '400ms', animationDelay: `${barberIndex * 60}ms` }} onMouseEnter={e => (e.currentTarget.style.boxShadow = isOverdue ? '0 0 25px rgba(239,68,68,0.06)' : '0 0 25px rgba(250,204,21,0.06)')} onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 0 25px rgba(0,0,0,0.15)')}>
                                    <div className="p-4">
                                        {/* Top row: Avatar + Name + Status */}
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-9 h-9 rounded-full bg-[var(--bg-card)]/80 border border-white/[0.08] flex items-center justify-center shrink-0 overflow-hidden">
                                                {barber.photoUrl ? <img src={barber.photoUrl} alt={barber.name} className="w-full h-full object-cover" /> : <User className="w-3.5 h-3.5 text-[var(--text-muted)]" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{barber.name}</p>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusDot}`} />
                                                    <span className={`text-[10px] font-bold uppercase tracking-wider ${statusColor.split(' ')[0]}`}>{statusText}</span>
                                                    {isOverdue && <span className="text-red-400/70 text-[10px] font-semibold ml-1">há {daysPending} dias</span>}
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0 border border-white/[0.06] hover:bg-white/5 text-[var(--text-muted)] hover:text-[var(--text-secondary)] shrink-0 transition-all duration-200"
                                                onClick={() => { setSelectedBarberDetails(barber); setDetailsModalOpen(true); }}
                                            >
                                                <Eye className="w-3.5 h-3.5" />
                                            </Button>
                                        </div>

                                        {/* Middle: Value (biggest element) + Secondary info */}
                                        <div className="flex items-end justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                                {/* VALUE — Level 1 */}
                                                {barber.totalCommission > 0 ? (
                                                    <div>
                                                        <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-medium mb-1">Comissão a pagar</p>
                                                        <p className={`text-xl sm:text-2xl font-bold tabular-nums leading-none ${isOverdue ? 'text-red-400' : 'text-[var(--text-primary)]'}`}>
                                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(barber.totalCommission)}
                                                        </p>
                                                    </div>
                                                ) : barber.totalCommissionPaid > 0 ? (
                                                    <div>
                                                        <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest font-bold mb-1">Comissão paga</p>
                                                        <p className="text-xl font-bold tabular-nums leading-none text-green-400/40 line-through">
                                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(barber.totalCommissionPaid)}
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <p className="text-sm text-[var(--text-muted)] italic">Sem comissão no período</p>
                                                )}

                                                {/* Secondary info — Level 3 */}
                                                <div className="flex flex-col gap-0.5 mt-2.5 text-[11px] text-[var(--text-muted)]">
                                                    <span>{barber.totalAppointments} atendimento{barber.totalAppointments !== 1 ? 's' : ''}</span>
                                                    <span>Faturamento: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(barber.totalRevenue)}</span>
                                                </div>
                                            </div>

                                            {/* Action button */}
                                            <div className="shrink-0">
                                                {recentlyPaid.includes(barber.id) ? (
                                                    <div className="h-8 flex items-center px-3 rounded-md bg-green-500/10 text-green-400 text-xs font-semibold border border-green-500/15">
                                                        <Check className="w-3.5 h-3.5 mr-1.5" /> Pago!
                                                    </div>
                                                ) : barber.totalCommission > 0 ? (
                                                    <Button
                                                        className={`h-8 font-semibold text-xs transition-all duration-200 rounded-md px-4 hover:scale-[1.03] active:scale-[0.97] ${isOverdue ? 'bg-red-500 hover:bg-red-400 text-white' : 'bg-zinc-200/90 hover:bg-white text-zinc-900'}`}
                                                        style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
                                                        disabled={isPaying && payingBarberId === barber.id}
                                                        onClick={() => openPaymentModal(barber.id, barber.name, barber.totalCommission)}
                                                    >
                                                        {isPaying && payingBarberId === barber.id ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <>
                                                                <Wallet className="w-4 h-4 mr-2" />
                                                                Pagar
                                                            </>
                                                        )}
                                                    </Button>
                                                ) : null}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Progress bar */}
                                    {totalGenerated > 0 && (
                                        <div className="px-4 sm:px-5 pb-3">
                                            <div className="h-1 w-full bg-[var(--bg-card)]/60 rounded-full overflow-hidden flex">
                                                {barber.totalCommissionPaid > 0 && <div className="h-full bg-green-500/50 rounded-full transition-all duration-700 ease-out" style={{ width: `${Math.min((barber.totalCommissionPaid / totalGenerated) * 100, 100)}%`, boxShadow: '0 0 6px rgba(34,197,94,0.2)' }} />}
                                                {barber.totalCommission > 0 && <div className="h-full bg-zinc-500/40 rounded-full transition-all duration-700 ease-out" style={{ width: `${Math.min((barber.totalCommission / totalGenerated) * 100, 100)}%` }} />}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    {/* FIM COLUNA ESQUERDA */}

                    {/* =========================================== */}
                    {/* BLOCO B — ANÁLISE (secundário)              */}
                    {/* =========================================== */}
                    {/* COLUNA DIREITA: RANKING */}
                    <div className="lg:col-span-1">
                    <div className="lg:sticky lg:top-6 space-y-6">
                    {data.barbers.length > 0 && (() => {
                        const maxRevenue = Math.max(...data.barbers.map((b: any) => b.totalRevenue), 1)
                        return (
                            <div className="bg-[var(--bg-page)]/80 backdrop-blur-sm border border-white/[0.06] rounded-xl p-4" style={{ boxShadow: '0 0 25px rgba(0,0,0,0.15)' }}>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-md bg-[var(--bg-card)]/80 flex items-center justify-center border border-white/[0.06]">
                                            <Trophy className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold text-[var(--text-secondary)]">Top Profissionais</p>
                                            <p className="text-[10px] text-[var(--text-muted)]">{data.barbers.length} no período</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    {data.barbers.map((b: any, i: number) => {
                                        const pct = (b.totalRevenue / maxRevenue) * 100
                                        const medals = ['🥇', '🥈', '🥉']
                                        const avgTicket = b.totalAppointments > 0 ? b.totalRevenue / b.totalAppointments : 0
                                        return (
                                            <div key={b.id} className="flex items-center gap-3 transition-all duration-300">
                                                <span className="w-6 text-center text-base shrink-0">
                                                    {i < 3 ? medals[i] : <span className="text-[var(--text-muted)] text-xs font-bold">#{i + 1}</span>}
                                                </span>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-xs font-semibold text-[var(--text-secondary)] truncate">
                                                            {b.name.split(' ')[0]}
                                                        </span>
                                                        <span className="text-xs font-semibold shrink-0 tabular-nums text-[var(--text-secondary)] ml-2">
                                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(b.totalRevenue)}
                                                        </span>
                                                    </div>
                                                    <div className="h-1.5 bg-[var(--bg-card)]/60 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full transition-all duration-700 ease-out ${i === 0 ? 'bg-zinc-300' : 'bg-zinc-500'}`}
                                                            style={{ width: `${pct}%`, boxShadow: i === 0 ? '0 0 6px rgba(200,200,200,0.15)' : 'none' }}
                                                        />
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-1.5 text-[10px] text-[var(--text-muted)]">
                                                        <span>{b.totalAppointments} atend.</span>
                                                        <span className="text-zinc-700">•</span>
                                                        <span>Ticket: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(avgTicket)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )
                    })()}
                    </div>
                    </div>
                    {/* FIM GRID */}
                    </div>

                    {/* Barber Details Modal */}
                    <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
                        <DialogContent className="bg-[var(--bg-card)] border-white/10 text-[var(--text-primary)] max-w-4xl max-h-[85vh] flex flex-col p-0 overflow-hidden">
                            {selectedBarberDetails && (
                                <>
                                    <div className="p-6 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[var(--bg-page)]/50">
                                        <div>
                                            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                                                {selectedBarberDetails.name}
                                            </DialogTitle>
                                            <DialogDescription className="text-[var(--text-secondary)] mt-1">
                                                Relatório de atendimentos no período selecionado.
                                            </DialogDescription>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right mr-2">
                                                <p className="text-xs text-[var(--text-muted)] uppercase font-bold tracking-wider">Total Pago:</p>
                                                <p className="text-xs text-[var(--text-muted)] uppercase font-semibold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedBarberDetails.totalCommissionPaid)}</p>
                                            </div>
                                            <div className="h-10 w-px bg-white/10 mx-2"></div>
                                            <div className="text-right">
                                                <p className="text-xs text-red-500/80 uppercase font-bold tracking-wider">Pendente</p>
                                                <p className="text-2xl font-black text-green-400">
                                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedBarberDetails.totalCommission)}
                                                </p>
                                            </div>
                                            <div className="h-10 w-px bg-white/10 mx-2"></div>
                                            <Button variant="outline" size="sm" className="bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-zinc-700 h-12" onClick={exportDetailedCSV}>
                                                <Download className="w-4 h-4 mr-2" /> CSV
                                            </Button>
                                            {selectedBarberDetails.totalCommission > 0 && (
                                                <div className="flex flex-col sm:flex-row gap-2 ml-4">
                                                    <Button onClick={() => setValeModalOpen(true)} variant="outline" disabled={isPaying} className="bg-black/20 border-white/10 hover:bg-white/5 text-[var(--text-secondary)] font-bold h-12 px-6 transition-all">
                                                        Abater Vale
                                                    </Button>
                                                    <Button onClick={handlePayAll} disabled={isPaying} className="bg-green-600 hover:bg-green-500 text-white font-bold h-12 px-6 shadow-[0_0_20px_rgba(22,163,74,0.3)] transition-all">
                                                        {isPaying ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Check className="w-5 h-5 mr-2" />}
                                                        Pagar Tudo
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex-1 overflow-auto p-0">
                                        <Table>
                                            <TableHeader className="bg-zinc-950/50 sticky top-0 z-10">
                                                <TableRow className="border-white/5 hover:bg-transparent">
                                                    <TableHead className="text-[var(--text-secondary)]">Data e Hora</TableHead>
                                                    <TableHead className="text-[var(--text-secondary)]">Cliente</TableHead>
                                                    <TableHead className="text-[var(--text-secondary)]">Serviço</TableHead>
                                                    <TableHead className="text-right text-[var(--text-secondary)]">Valor Cobrado</TableHead>
                                                    <TableHead className="text-right text-[var(--text-secondary)]">Comissão Gerada</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {selectedBarberDetails.appointmentsList.length === 0 ? (
                                                    <TableRow className="border-white/5">
                                                        <TableCell colSpan={5} className="text-center py-8 text-[var(--text-muted)]">
                                                            Nenhum atendimento na lista.
                                                        </TableCell>
                                                    </TableRow>
                                                ) : (
                                                    selectedBarberDetails.appointmentsList.map((app: any) => (
                                                        <TableRow key={app.id} className="border-white/5 hover:bg-white/5">
                                                            <TableCell className="whitespace-nowrap">
                                                                <div className="font-medium">{format(new Date(app.date), "dd/MM/yyyy")}</div>
                                                                <div className="text-xs text-[var(--text-muted)]">{app.time?.slice(0, 5)}</div>
                                                            </TableCell>
                                                            <TableCell>{app.clientName}</TableCell>
                                                            <TableCell className="text-[var(--text-secondary)]">{app.service}</TableCell>
                                                            <TableCell className="text-right font-medium">
                                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(app.value)}
                                                            </TableCell>
                                                            <TableCell className="text-right font-bold text-green-400/80">
                                                                <div className="flex flex-col items-end gap-1">
                                                                    <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(app.commission)}</span>
                                                                    {app.isPaid ? (
                                                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 uppercase tracking-widest border border-green-500/30">Pago</span>
                                                                    ) : app.paidAmount > 0 ? (
                                                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 uppercase tracking-widest border border-orange-500/30">P. Parcial</span>
                                                                    ) : (
                                                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-500/20 text-[var(--text-secondary)] uppercase tracking-widest border border-zinc-500/30">Pendente</span>
                                                                    )}
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </>
                            )}
                        </DialogContent>
                    </Dialog>

                    {/* Barber Configuration Modal */}
                    <Dialog open={configModalOpen} onOpenChange={setConfigModalOpen}>
                        <DialogContent className="bg-[var(--bg-card)] border-white/10 text-[var(--text-primary)] max-w-2xl max-h-[85vh] flex flex-col p-6 overflow-hidden">
                            <DialogHeader className="mb-4">
                                <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                                    <Settings className="w-5 h-5 text-[#DBC278]" />
                                    Configurar Comissões
                                </DialogTitle>
                                <DialogDescription className="text-[var(--text-secondary)] mt-1">
                                    Defina o tipo e valor da comissão para cada profissional.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                                {configBarbers.map((barber) => (
                                    <div key={barber.id} className="bg-[var(--bg-page)]/50 border border-white/5 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                        <div className="flex items-center gap-3 w-full sm:w-1/3">
                                            <div className="w-10 h-10 rounded-full bg-[var(--bg-card)] flex items-center justify-center border border-white/10 flex-shrink-0">
                                                <User className="w-5 h-5 text-[var(--text-secondary)]" />
                                            </div>
                                            <span className="font-bold">{barber.name}</span>
                                        </div>
                                        <div className="w-full sm:w-2/3 flex gap-3">
                                            <div className="flex-1">
                                                <label className="text-xs text-[var(--text-muted)] mb-1 block">Tipo</label>
                                                <Select value={barber.commission_type || "percentage"} onValueChange={(val) => handleConfigTypeChange(barber.id, val)}>
                                                    <SelectTrigger className="bg-black/20 border-white/10 h-9"><SelectValue /></SelectTrigger>
                                                    <SelectContent className="bg-[var(--bg-card)] border-white/10 text-[var(--text-primary)]">
                                                        <SelectItem value="percentage">Porcentagem (%)</SelectItem>
                                                        <SelectItem value="fixed">Valor Fixo (R$)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="flex-1">
                                                <label className="text-xs text-[var(--text-muted)] mb-1 block">Valor</label>
                                                <div className="relative">
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--text-muted)] text-sm">
                                                        {barber.commission_type === 'fixed' ? 'R$' : '%'}
                                                    </div>
                                                    <Input type="text" value={barber.commission_value || 0} onChange={(e) => handleConfigValueChange(barber.id, barber.commission_type || 'percentage', e.target.value)} className="bg-black/20 border-white/10 h-9 pl-9" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {configBarbers.length === 0 && (
                                    <div className="text-center py-10 text-[var(--text-muted)]">Nenhum profissional encontrado.</div>
                                )}
                            </div>
                            <div className="mt-6 pt-6 border-t border-white/5 flex justify-end gap-3">
                                <Button variant="ghost" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]" onClick={() => setConfigModalOpen(false)}>Cancelar</Button>
                                <Button onClick={saveConfig} disabled={savingConfig} className="bg-white hover:bg-zinc-100 text-zinc-900 font-semibold transition-all duration-200">
                                    {savingConfig ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                                    Salvar Alterações
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>

                    {/* Payment Registration Modal */}
                    <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
                        <DialogContent className="bg-[var(--bg-card)] border-white/10 text-[var(--text-primary)] max-w-sm flex flex-col p-6 overflow-hidden">
                            <DialogHeader className="mb-4">
                                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                                    <Wallet className="w-5 h-5 text-green-400" />
                                    Registrar Pagamento
                                </DialogTitle>
                                <DialogDescription className="text-[var(--text-secondary)] mt-1 pb-4 border-b border-white/5">
                                    Confirme os dados do repasse para registrar a baixa.
                                </DialogDescription>
                            </DialogHeader>
                            {selectedPaymentBarber && (
                                <div className="space-y-5">
                                    <div className="flex justify-between items-center bg-black/20 p-3 rounded-xl border border-white/5">
                                        <div className="flex flex-col">
                                            <span className="text-xs text-[var(--text-muted)] uppercase font-bold tracking-wider">Profissional</span>
                                            <span className="text-sm font-semibold text-[var(--text-primary)] mt-0.5">{selectedPaymentBarber.name}</span>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-xs text-[var(--text-muted)] uppercase font-bold tracking-wider">Valor do Repasse</span>
                                            <span className="text-lg font-black text-green-400 mt-0.5">
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedPaymentBarber.amount)}
                                            </span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs text-[var(--text-muted)] mb-2 block font-medium">Método de pagamento</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {(['pix', 'dinheiro', 'transferencia'] as const).map(method => (
                                                <button key={method} onClick={() => setPaymentMethod(method)}
                                                    className={`py-2 px-1 text-xs font-bold rounded-lg border transition-all ${paymentMethod === method ? 'bg-green-500/20 border-green-500/50 text-green-400' : 'bg-black/20 border-white/5 text-[var(--text-secondary)] hover:bg-white/5'}`}
                                                >
                                                    {method === 'pix' ? 'PIX' : method === 'dinheiro' ? 'Dinheiro' : 'Banco'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div className="mt-8 pt-4 flex justify-end gap-3">
                                <Button variant="ghost" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]" onClick={() => setPaymentModalOpen(false)}>Cancelar</Button>
                                <Button onClick={confirmPayment} disabled={isPaying} className="bg-green-500 hover:bg-green-400 text-white font-bold w-full sm:w-auto transition-all duration-300 hover:scale-[1.02]" style={{ boxShadow: '0 0 15px rgba(34, 197, 94, 0.25)' }}>
                                    {isPaying ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                                    Confirmar pagamento
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>

                    {/* Abater Vale Modal */}
                    <Dialog open={valeModalOpen} onOpenChange={setValeModalOpen}>
                        <DialogContent className="bg-[var(--bg-card)] border-white/10 text-[var(--text-primary)] max-w-sm flex flex-col p-6 overflow-hidden">
                            <DialogHeader className="mb-4">
                                <DialogTitle className="text-xl font-bold">Abater Vale</DialogTitle>
                                <DialogDescription className="text-[var(--text-secondary)] mt-1">
                                    Digite o valor exato a ser deduzido das comissões pendentes de {selectedBarberDetails?.name}.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="flex-1">
                                <label className="text-xs text-[var(--text-muted)] mb-1 block">Valor do Vale</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--text-muted)] text-sm">R$</div>
                                    <Input type="text" autoFocus value={valeAmount} onChange={(e) => handleValeChange(e.target.value)} className="bg-black/20 border-white/10 h-14 pl-9 text-xl font-medium" placeholder="0,00" />
                                </div>
                            </div>
                            <div className="mt-6 pt-6 border-t border-white/5 flex justify-end gap-3">
                                <Button variant="ghost" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]" onClick={() => { setValeModalOpen(false); setValeAmount(""); }}>Cancelar</Button>
                                <Button onClick={handleAbaterVale} disabled={isPaying || !valeAmount} className="bg-green-600 hover:bg-green-500 text-white font-bold">
                                    {isPaying ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                                    Confirmar Vale
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </>
            )}
        </div>
    )
}

function SummaryCard({ title, value, icon, color, tooltip }: { title: string, value: string | React.ReactNode, icon: React.ReactNode, color?: string, tooltip?: string }) {
    return (
        <Card className="relative overflow-hidden bg-[var(--bg-card)] border-white/5 text-[var(--text-primary)] shadow-xl" title={tooltip}>
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${color || 'from-white/5 to-transparent'} blur-3xl opacity-50`} />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                <CardTitle className={`text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider ${tooltip ? 'border-b border-dashed border-zinc-600 cursor-help' : ''}`}>
                    {title}
                </CardTitle>
                <div className="p-2 bg-black/20 rounded-lg backdrop-blur-sm border border-white/5">
                    {icon}
                </div>
            </CardHeader>
            <CardContent className="relative z-10">
                <div className="text-3xl font-black tracking-tight mt-1">{value}</div>
            </CardContent>
        </Card>
    )
}
