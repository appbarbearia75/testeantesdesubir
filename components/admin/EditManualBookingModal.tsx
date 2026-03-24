import { useState, useEffect, useMemo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Calendar as CalendarIcon, Clock, User, Phone, Pencil, Loader2, Trash2, Plus, Scissors, ChevronRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { format, addMinutes } from 'date-fns'
import { parseDuration } from '@/lib/utils'

export function EditBookingModal({ isOpen, onOpenChange, booking, onSuccess, slug }: {
    isOpen: boolean,
    onOpenChange: (open: boolean) => void,
    booking: any,
    onSuccess: () => void,
    slug?: string
}) {
    const [name, setName] = useState('')
    const [phone, setPhone] = useState('')
    const [date, setDate] = useState('')
    const [time, setTime] = useState('')
    const [loading, setLoading] = useState(false)
    const [isFetchingServices, setIsFetchingServices] = useState(false)
    
    // Services state
    const [allServices, setAllServices] = useState<any[]>([])
    const [selectedServices, setSelectedServices] = useState<any[]>([])
    const [initialBookingIds, setInitialBookingIds] = useState<string[]>([])
    const [showServiceSelector, setShowServiceSelector] = useState(false)

    // Fetch all available services
    useEffect(() => {
        if (isOpen && slug) {
            const fetchAllServices = async () => {
                const { data: b } = await supabase.from('barbershops').select('id').eq('slug', slug).single()
                if (b) {
                    const { data: s } = await supabase.from('services').select('*').eq('barbershop_id', b.id).order('position', { ascending: true })
                    if (s) setAllServices(s)
                }
            }
            fetchAllServices()
        }
    }, [isOpen, slug])

    useEffect(() => {
        if (isOpen && booking) {
            setName(booking.customer_name || '')
            setPhone(booking.customer_phone || '')
            setDate(booking.date || '')
            setTime(booking.time?.slice(0, 5) || '')
            
            // Fetch related bookings to identify the "session"
            const fetchSession = async () => {
                setIsFetchingServices(true)
                try {
                    // Current patterns: session = same customer + phone + date + barber
                    // We also want them to be contiguous, but usually fetching all for that day/barber is enough
                    const { data: related } = await supabase
                        .from('bookings')
                        .select('*, services(id, title, duration, price)')
                        .eq('customer_phone', booking.customer_phone)
                        .eq('date', booking.date)
                        .eq('barber_id', booking.barber_id)
                        .neq('status', 'cancelled')
                        .order('time', { ascending: true })

                    if (related) {
                        // Find the contiguous set that includes the current booking
                        const currentIndex = related.findIndex(b => b.id === booking.id)
                        if (currentIndex !== -1) {
                            let session = [related[currentIndex]]
                            
                            // Check previous
                            for (let i = currentIndex - 1; i >= 0; i--) {
                                const curr = related[i+1]
                                const prev = related[i]
                                // If prev.time + prev.duration == curr.time, they are contiguous
                                // Since logic is simple, we check if they are "touching"
                                session.unshift(prev)
                            }
                            
                            // Check next
                            for (let i = currentIndex + 1; i < related.length; i++) {
                                session.push(related[i])
                            }

                            const services = session.map(b => ({
                                ...b.services,
                                booking_id: b.id // keep track to know which ones to delete/update
                            })).filter(s => s.id)

                            setSelectedServices(services)
                            setInitialBookingIds(session.map(b => b.id))
                            
                            // Update start time to the first booking in session
                            if (session.length > 0) {
                                setTime(session[0].time.slice(0, 5))
                            }
                        }
                    }
                } catch (error) {
                    console.error("Error fetching session:", error)
                } finally {
                    setIsFetchingServices(false)
                }
            }
            fetchSession()
        }
    }, [isOpen, booking])

    const totalDuration = useMemo(() => {
        return selectedServices.reduce((acc, s) => acc + parseDuration(s.duration), 0)
    }, [selectedServices])

    const totalPrice = useMemo(() => {
        return selectedServices.reduce((acc, s) => acc + Number(s.price || 0), 0)
    }, [selectedServices])

    const addService = (service: any) => {
        setSelectedServices(prev => [...prev, service])
        setShowServiceSelector(false)
    }

    const removeService = (index: number) => {
        setSelectedServices(prev => prev.filter((_, i) => i !== index))
    }

    const handleSave = async () => {
        if (!name || !date || !time || selectedServices.length === 0) {
            alert('Preencha pelo menos Nome, Data, Horário e selecione um serviço.')
            return
        }

        setLoading(true)
        try {
            // 1. Delete initial session bookings
            if (initialBookingIds.length > 0) {
                const { error: delErr } = await supabase
                    .from('bookings')
                    .delete()
                    .in('id', initialBookingIds)
                if (delErr) throw delErr
            }

            // 2. Prepare new bookings based on updated services
            const [h, m] = time.split(':').map(Number)
            let currentSlotTime = new Date()
            currentSlotTime.setHours(h, m, 0, 0)

            const bookingsToInsert = selectedServices.map((service) => {
                const bookingTimeStr = format(currentSlotTime, 'HH:mm')
                const durationMinutes = parseDuration(service.duration)
                currentSlotTime = addMinutes(currentSlotTime, durationMinutes)

                return {
                    barbershop_id: booking.barbershop_id,
                    service_id: service.id,
                    barber_id: booking.barber_id,
                    date,
                    time: bookingTimeStr,
                    customer_name: name,
                    customer_phone: phone,
                    status: 'confirmed'
                }
            })

            // 3. Check for conflicts (excluding the ones we just deleted, though delete is immediate in Supabase)
            const timesToCheck = bookingsToInsert.map(b => b.time)
            const { data: conflicts } = await supabase
                .from('bookings')
                .select('id')
                .eq('barbershop_id', booking.barbershop_id)
                .eq('date', date)
                .eq('barber_id', booking.barber_id)
                .neq('status', 'cancelled')
                .in('time', timesToCheck)

            if (conflicts && conflicts.length > 0) {
                alert("Conflito de horário detectado. Verifique se o novo tempo total não sobrepõe outros agendamentos.")
                setLoading(false)
                return
            }

            // 4. Insert new bookings
            const { error: insErr } = await supabase.from('bookings').insert(bookingsToInsert)
            if (insErr) throw insErr

            onSuccess()
            onOpenChange(false)
            alert('Agendamento atualizado com sucesso!')
        } catch (error) {
            console.error(error)
            alert('Erro ao atualizar agendamento.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-primary)] shadow-2xl sm:max-w-[450px] p-0 overflow-hidden rounded-3xl">
                <DialogHeader className="p-6 pb-2 border-b border-[var(--border-color)] bg-[var(--bg-input)]/50">
                    <DialogTitle className="text-xl flex items-center gap-3 font-black uppercase tracking-tight">
                        <div className="p-2 bg-[var(--accent-primary)]/10 rounded-xl">
                            <Pencil className="w-5 h-5 text-[var(--accent-primary)]" />
                        </div>
                        Editar Agendamento
                    </DialogTitle>
                </DialogHeader>

                <div className="max-h-[70vh] overflow-y-auto px-6 py-6 space-y-6 custom-scrollbar">
                    {/* Dados Básicos */}
                    <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2">
                            <Label className="text-[var(--text-secondary)] text-xs font-bold uppercase tracking-widest pl-1">Nome do Cliente</Label>
                            <div className="relative group">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] group-focus-within:text-[var(--accent-primary)] transition-colors" />
                                <Input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="pl-10 bg-[var(--bg-input)] border-[var(--border-color)] focus-visible:ring-[var(--accent-primary)] h-12 rounded-xl font-bold"
                                    placeholder="Nome completo"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[var(--text-secondary)] text-xs font-bold uppercase tracking-widest pl-1">Telefone</Label>
                            <div className="relative group">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] group-focus-within:text-[var(--accent-primary)] transition-colors" />
                                <Input
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="pl-10 bg-[var(--bg-input)] border-[var(--border-color)] focus-visible:ring-[var(--accent-primary)] h-12 rounded-xl font-bold"
                                    placeholder="(00) 00000-0000"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[var(--text-secondary)] text-xs font-bold uppercase tracking-widest pl-1">Data</Label>
                                <div className="relative group">
                                    <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] group-focus-within:text-[var(--accent-primary)] transition-colors" />
                                    <Input
                                        type="date"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className="pl-10 bg-[var(--bg-input)] border-[var(--border-color)] focus-visible:ring-[var(--accent-primary)] h-12 text-[var(--text-primary)] rounded-xl font-bold"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[var(--text-secondary)] text-xs font-bold uppercase tracking-widest pl-1">Horário de Início</Label>
                                <div className="relative group">
                                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] group-focus-within:text-[var(--accent-primary)] transition-colors" />
                                    <Input
                                        type="time"
                                        value={time}
                                        onChange={(e) => setTime(e.target.value)}
                                        className="pl-10 bg-[var(--bg-input)] border-[var(--border-color)] focus-visible:ring-[var(--accent-primary)] h-12 text-[var(--text-primary)] rounded-xl font-bold"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Seção de Serviços */}
                    <div className="space-y-4 pt-2">
                        <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2 mx-1">
                            <Label className="text-[var(--text-primary)] text-sm font-black uppercase tracking-tight flex items-center gap-2">
                                <Scissors className="w-4 h-4 text-[var(--accent-primary)]" />
                                Serviços do Agendamento
                            </Label>
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => setShowServiceSelector(!showServiceSelector)}
                                className="text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 font-black text-[10px] uppercase h-7 px-2"
                            >
                                <Plus className="w-3 h-3 mr-1" />
                                Adicionar
                            </Button>
                        </div>

                        {/* Seletor de Serviços (Inline Dropdown) */}
                        {showServiceSelector && (
                            <div className="bg-[var(--bg-input)] border border-[var(--border-color)] rounded-2xl p-3 animate-in slide-in-from-top-2 duration-200 shadow-xl">
                                <p className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 px-1">Selecione para adicionar:</p>
                                <div className="grid gap-2 max-h-[160px] overflow-y-auto pr-1">
                                    {allServices.map(s => (
                                        <button
                                            key={s.id}
                                            onClick={() => addService(s)}
                                            className="w-full flex items-center justify-between p-3.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[var(--accent-primary)] transition-all group active:scale-[0.98] shadow-sm"
                                        >
                                            <div className="flex flex-col text-left">
                                                <p className="font-black text-xs text-[var(--text-primary)] uppercase tracking-tight">{s.title}</p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase">{s.duration}</p>
                                                    <p className="text-[11px] font-black text-[var(--accent-primary)]">R$ {Number(s.price).toFixed(0)}</p>
                                                </div>
                                            </div>
                                            <div className="p-1.5 rounded-lg bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] group-hover:bg-[var(--accent-primary)] group-hover:text-black transition-colors">
                                                <Plus className="w-4 h-4" />
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Lista de Serviços Atuais */}
                        <div className="space-y-2">
                            {isFetchingServices ? (
                                <div className="flex items-center justify-center py-6 gap-2 text-[var(--text-secondary)]">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span className="text-xs font-bold uppercase tracking-widest">Carregando serviços...</span>
                                </div>
                            ) : selectedServices.length > 0 ? (
                                selectedServices.map((s, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-[var(--bg-input)]/50 border border-[var(--border-color)] group hover:border-[var(--accent-primary)]/20 transition-all shadow-sm">
                                        <div className="flex flex-col">
                                            <p className="font-black text-sm text-[var(--text-primary)] uppercase tracking-tight leading-none mb-1">{s.title}</p>
                                            <div className="flex items-center gap-3">
                                                <p className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">{s.duration}</p>
                                                <p className="text-[13px] font-black text-[var(--accent-primary)]">R$ {Number(s.price).toFixed(0)}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <p className="font-black text-xs text-[var(--accent-primary)]">R$ {Number(s.price).toFixed(0)}</p>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => removeService(idx)}
                                                className="w-8 h-8 rounded-lg text-danger-color hover:bg-danger-color/10"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 bg-[var(--bg-input)]/30 rounded-2xl border-2 border-dashed border-[var(--border-color)]">
                                    <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">Nenhum serviço selecionado</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Resumo */}
                    <div className="bg-[var(--accent-primary)]/5 rounded-2xl p-4 border border-[var(--accent-primary)]/10 flex items-center justify-between">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest">Tempo Total</p>
                            <p className="text-lg font-black text-[var(--text-primary)] leading-none">{totalDuration} min</p>
                        </div>
                        <div className="text-right space-y-1">
                            <p className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest">Valor Total</p>
                            <p className="text-xl font-black text-[var(--accent-primary)] leading-none">R$ {totalPrice.toFixed(2).replace('.', ',')}</p>
                        </div>
                    </div>
                </div>

                <DialogFooter className="p-6 border-t border-[var(--border-color)] bg-[var(--bg-input)]/30 flex gap-3">
                    <Button
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)] font-bold flex-1 h-12 rounded-xl"
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={loading || isFetchingServices || selectedServices.length === 0}
                        className="bg-[var(--accent-primary)] text-black hover:bg-[var(--accent-primary)]/80 flex-1 font-black h-12 rounded-xl shadow-lg shadow-[var(--accent-primary)]/20 transition-all active:scale-95"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Salvar Alterações"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
} 
