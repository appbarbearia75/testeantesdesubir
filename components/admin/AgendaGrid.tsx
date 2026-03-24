"use client"

import { useState, useEffect, useRef } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Calendar as CalendarIcon, Check, X, Clock, User, Phone, Scissors, Lock, Unlock, MessageSquare, Plus, Loader2, Pencil, ChevronLeft, ChevronRight, ShoppingCart, CheckCircle, ListTodo, CreditCard, Banknote, QrCode, ArrowLeft, Crown } from "lucide-react"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/lib/supabase"
import { format, addMinutes, startOfDay, endOfDay, isSameDay } from "date-fns"
import { ptBR } from "date-fns/locale"
import { FullCalendarModal } from "@/components/DateSelector"
import { CreateManualBookingModal } from "@/components/admin/CreateManualBookingModal"
import { EditBookingModal } from "@/components/admin/EditManualBookingModal"
import { CreateScheduleBlockModal } from "@/components/admin/CreateScheduleBlockModal"

// Define a interface para os agendamentos no grid
interface GridBooking {
    id: string;
    barber_id: string;
    date: string;
    time: string;
    end_time: string;
    customer_name: string;
    customer_phone: string;
    service_title: string;
    status: string;
    duration: number;
    price: string;
    barber_data: any;
    is_vip?: boolean;
    command_id?: string;
}

export function AgendaGrid() {
    const params = useParams()
    const slug = params.slug as string
    const [barbers, setBarbers] = useState<any[]>([])
    const [bookings, setBookings] = useState<GridBooking[]>([])
    const [view, setView] = useState<'daily' | 'weekly'>('daily')
    const [selectedBarberId, setSelectedBarberId] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [date, setDate] = useState(new Date())
    const [isCalendarOpen, setIsCalendarOpen] = useState(false)
    const [isManualBookingModalOpen, setIsManualBookingModalOpen] = useState(false)
    const [isScheduleBlockModalOpen, setIsScheduleBlockModalOpen] = useState(false)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [selectedSlot, setSelectedSlot] = useState<{ barber_id: string, time: string } | null>(null)
    const [actionBooking, setActionBooking] = useState<GridBooking | null>(null)
    const [isFaturando, setIsFaturando] = useState(false)
    const router = useRouter()

    // Configurações do Grid
    const startHour = 8;
    const endHour = 21;
    const timeStep = 15; // minutos

    const timeSlots = [];
    for (let hour = startHour; hour <= endHour; hour++) {
        for (let min = 0; min < 60; min += timeStep) {
            const h = hour.toString().padStart(2, '0');
            const m = min.toString().padStart(2, '0');
            timeSlots.push(`${h}:${m}`);
        }
    }

    const [barbershopSettings, setBarbershopSettings] = useState<any>(null)

    // Helper para dias da semana na visão semanal
    const getWeekDays = () => {
        const start = new Date(date)
        const day = start.getDay() || 7 // 1 (Mon) to 7 (Sun)
        start.setDate(start.getDate() - day + 1) // Move to Monday

        return Array.from({ length: 7 }, (_, i) => {
            const d = new Date(start)
            d.setDate(d.getDate() + i)
            return d
        })
    }

    useEffect(() => {
        fetchData()
        const interval = setInterval(() => fetchData(false), 60000)
        return () => clearInterval(interval)
    }, [slug, date, view, selectedBarberId])

    // Efeito para selecionar o primeiro barbeiro quando mudar para semanal
    useEffect(() => {
        if (view === 'weekly' && !selectedBarberId && barbers.length > 0) {
            setSelectedBarberId(barbers[0].id)
        }
    }, [view, barbers])

    const fetchData = async (showLoading = true) => {
        if (showLoading) setLoading(true)

        try {
            const { data: barbershop } = await supabase.from('barbershops').select('id, name, opening_hours').eq('slug', slug).single()
            if (!barbershop) return
            setBarbershopSettings(barbershop)

            // --- PARALLEL DATA FETCHING ---
            let bookingsQuery = supabase
                .from('bookings')
                .select(`
                    id,
                    barber_id,
                    time,
                    date,
                    customer_name,
                    customer_phone,
                    status,
                    command_id,
                    services (title, duration, price)
                `)
                .eq('barbershop_id', barbershop.id)
                .neq('status', 'cancelled');

            if (view === 'daily') {
                bookingsQuery.eq('date', format(date, 'yyyy-MM-dd'));
            } else {
                const weekDays = getWeekDays();
                bookingsQuery.gte('date', format(weekDays[0], 'yyyy-MM-dd'));
                bookingsQuery.lte('date', format(weekDays[6], 'yyyy-MM-dd'));
                if (selectedBarberId) {
                    bookingsQuery.eq('barber_id', selectedBarberId);
                }
            }

            let blocksQuery = supabase
                .from('schedule_blocks')
                .select('*')
                .eq('barbershop_id', barbershop.id);

            const [barbersRes, bookingsRes, blocksRes, authRes] = await Promise.all([
                supabase.from('barbers').select('*').eq('barbershop_id', barbershop.id).eq('active', true).order('name', { ascending: true }),
                bookingsQuery,
                blocksQuery,
                supabase.auth.getUser()
            ]);

            let barbersData = barbersRes.data || [];
            const bookingsData = bookingsRes.data || [];
            const blocksData = blocksRes.data || [];

            const currentUser = authRes.data?.user;
            if (currentUser && currentUser.id !== barbershop.id) {
                // Restrict employee to only see their own column
                barbersData = barbersData.filter((b: any) => b.id === currentUser.id);
            }

            setBarbers(barbersData);

            // Fetch VIPs concurrently if there are phones
            const uniquePhones = Array.from(new Set(bookingsData.map(b => b.customer_phone).filter(Boolean)));
            const vipStatusMap: Record<string, boolean> = {};

            if (uniquePhones.length > 0) {
                const { data: vipClients } = await supabase
                    .from('clients')
                    .select('phone')
                    .eq('barbershop_id', barbershop.id)
                    .in('phone', uniquePhones)
                    .eq('is_vip', true);

                if (vipClients) {
                    vipClients.forEach(c => {
                        if (c.phone) vipStatusMap[c.phone] = true;
                    });
                }
            }

            const mappedBookings: GridBooking[] = (bookingsData || []).map(b => {
                let duration = 15;
                const dStr = (b.services as any)?.duration?.toString() || '15';
                if (dStr.includes(':')) {
                    const [dh, dm] = dStr.split(':').map(Number);
                    duration = (dh * 60) + (dm || 0);
                } else if (dStr.toLowerCase().includes('h')) {
                    const hMatch = dStr.match(/(\d+)\s*h/i);
                    const mMatch = dStr.match(/(\d+)\s*m/i);
                    const dh = hMatch ? parseInt(hMatch[1]) : 0;
                    const dm = mMatch ? parseInt(mMatch[1]) : 0;
                    duration = (dh * 60) + dm;
                    if (duration === 0) duration = parseInt(dStr.replace(/\D/g, '')) || 15;
                } else {
                    duration = parseInt(dStr.replace(/\D/g, '')) || 15;
                }

                const startTime = b.time.slice(0, 5);
                const [h, m] = startTime.split(':').map(Number);
                const endDate = new Date();
                endDate.setHours(h, m + duration, 0, 0);
                const endTime = format(endDate, 'HH:mm');
                const barberData = barbersData?.find((barber: any) => barber.id === b.barber_id);

                return {
                    id: b.id,
                    barber_id: b.barber_id,
                    date: b.date,
                    time: startTime,
                    end_time: endTime,
                    customer_name: b.customer_name,
                    customer_phone: b.customer_phone,
                    service_title: (b.services as any)?.title || "Serviço",
                    price: (b.services as any)?.price || "0.00",
                    status: b.status,
                    duration,
                    barber_data: barberData,
                    is_vip: !!vipStatusMap[b.customer_phone],
                    command_id: b.command_id
                };
            });

            const activeDates = view === 'daily' ? [date] : getWeekDays();
            const mappedBlocks: GridBooking[] = [];

            blocksData.forEach((block: any) => {
                activeDates.forEach(day => {
                    const dayStr = format(day, 'yyyy-MM-dd');
                    const dayOfWeek = day.getDay();

                    let appliesToDay = false;
                    if (!block.is_recurring && block.date === dayStr) {
                        appliesToDay = true;
                    } else if (block.is_recurring) {
                        if (block.recurrence_type === 'daily') appliesToDay = true;
                        if (block.recurrence_type === 'weekly' && block.recurrence_days?.includes(dayOfWeek)) appliesToDay = true;
                        if (block.recurrence_type === 'monthly' && new Date(`${block.date}T00:00:00`).getDate() === day.getDate()) appliesToDay = true;
                    }

                    if (appliesToDay) {
                        const [sh, sm] = block.start_time.split(':').map(Number);
                        const [eh, em] = block.end_time.split(':').map(Number);
                        const durationMins = (eh * 60 + em) - (sh * 60 + sm);

                        if (durationMins > 0) {
                            const targetBarbers = block.is_global ? barbersData : barbersData.filter((b: any) => b.id === block.professional_id);

                            targetBarbers.forEach((b: any) => {
                                mappedBlocks.push({
                                    id: `block-${block.id}-${b.id}-${dayStr}`,
                                    barber_id: b.id,
                                    date: dayStr,
                                    time: block.start_time.slice(0, 5),
                                    end_time: block.end_time.slice(0, 5),
                                    customer_name: "HORÁRIO BLOQUEADO",
                                    customer_phone: "",
                                    service_title: "BLOQUEADO",
                                    status: "locked",
                                    duration: durationMins,
                                    price: "0.00",
                                    barber_data: b,
                                    is_vip: false
                                });
                            });
                        }
                    }
                });
            });

            setBookings([...mappedBookings, ...mappedBlocks])
        } catch (error) {
            console.error("Error fetching data:", error)
        } finally {
            setLoading(false)
        }
    }

    const navigateDate = (days: number) => {
        const newDate = new Date(date)
        newDate.setDate(newDate.getDate() + days)
        setDate(newDate)
    }

    const updateStatus = async (id: string, newStatus: string, paymentMethod?: string) => {
        try {
            let commission_earned = 0
            if (newStatus === 'completed') {
                const b = bookings.find(b => b.id === id)
                if (b && b.barber_data) {
                    const cType = b.barber_data.commission_type || 'percentage'
                    const cValue = parseFloat(b.barber_data.commission_value) || 0
                    const bPrice = parseFloat(b.price || '0')
                    if (cType === 'percentage') {
                        commission_earned = bPrice * (cValue / 100)
                    } else if (cType === 'fixed') {
                        commission_earned = cValue
                    }

                    if (paymentMethod && barbershopSettings) {
                        try {
                            const { data: command, error: cmdErr } = await supabase.from('commands').insert([{
                                barbershop_id: barbershopSettings.id,
                                client_name: b.customer_name,
                                status: 'closed',
                                payment_method: paymentMethod,
                                total_amount: bPrice,
                                subtotal_amount: bPrice,
                                closed_at: new Date().toISOString()
                            }]).select().single()

                            if (cmdErr) throw cmdErr

                            if (command) {
                                await supabase.from('command_items').insert([{
                                    command_id: command.id,
                                    item_type: 'service',
                                    item_name: b.service_title,
                                    unit_price: bPrice,
                                    total_price: bPrice,
                                    quantity: 1,
                                    barber_id: b.barber_id
                                }])

                                await supabase.from('bookings').update({
                                    command_id: command.id,
                                    status: 'completed',
                                    commission_earned
                                }).eq('id', id)

                                fetchData(false)
                                setActionBooking(null)
                                setIsFaturando(false)
                                return
                            }
                        } catch (err) {
                            console.error("PDV auto execution error:", err);
                        }
                    }
                }
            }

            const updateData: any = { status: newStatus }
            if (newStatus === 'completed') {
                updateData.commission_earned = commission_earned
            }

            const { error } = await supabase
                .from('bookings')
                .update(updateData)
                .eq('id', id)

            if (error) {
                console.error("Error updating booking:", error)
                alert("Erro ao atualizar agendamento.")
            } else {
                fetchData(false)
                setActionBooking(null)
                setIsFaturando(false)

                if (newStatus === 'cancelled') {
                    const b = bookings.find(b => b.id === id);
                    if (b && b.customer_phone && barbershopSettings) {
                        const dateObj = new Date(b.date + 'T12:00:00'); // Ensure it's in the correct timezone context for formatting
                        fetch('/api/web-push/send', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                clientPhone: b.customer_phone,
                                barbershopId: barbershopSettings.id,
                                title: 'Agendamento Cancelado ❌',
                                body: `Seu agendamento para ${format(dateObj, 'dd/MM/yyyy')} às ${b.time} foi cancelado.`,
                                url: `/${slug}`
                            })
                        }).catch(console.error);
                    }
                }
            }
        } catch (error) {
            console.error("Error in updateStatus", error)
        }
    }

    const handleRefund = async (id: string, commandId?: string) => {
        if (!confirm("Deseja realmente estornar esta comanda?\n\nEsta ação irá:\n- Remover o registro de faturamento (se houver)\n- Voltar o agendamento para aberto\n- Zerar comissão do profissional")) return

        try {
            setLoading(true)

            // 1. Delete command if it exists
            if (commandId) {
                await supabase.from('command_items').delete().eq('command_id', commandId)
                const { error: cmdErr } = await supabase.from('commands').delete().eq('id', commandId)
                if (cmdErr) throw cmdErr
            }

            // 2. Update booking back to confirmed
            const { error: bookErr } = await supabase.from('bookings').update({
                status: 'confirmed',
                command_id: null,
                commission_earned: 0
            }).eq('id', id)

            if (bookErr) throw bookErr

            // 3. Refresh and close
            fetchData(false)
            setActionBooking(null)
            alert("Comanda estornada com sucesso!")

        } catch (error) {
            console.error("Error in refund:", error)
            alert("Erro ao realizar estorno.")
        } finally {
            setLoading(false)
        }
    }

    // Helper para agendamentos (considerando data se for semanal)
    const getBookingInSlot = (barber_id: string, time: string, dayDate?: Date) => {
        const [slotH, slotM] = time.split(':').map(Number);
        const slotStart = slotH * 60 + slotM;
        const slotEnd = slotStart + 15;

        const dateStr = format(dayDate || date, 'yyyy-MM-dd')

        return bookings.find(b => {
            if (b.barber_id !== barber_id) return false;
            if (b.date !== dateStr) return false;

            const [startH, startM] = b.time.split(':').map(Number);
            const startTotal = startH * 60 + startM;

            // Retorna o booking se ele COMEÇA dentro deste slot de 15 min
            return startTotal >= slotStart && startTotal < slotEnd;
        });
    }

    const isBarberOffline = (barber: any, time: string, dayDate: Date = date) => {
        const [h, m] = time.split(':').map(Number)
        const timeVal = h * 60 + m

        const parseTime = (t: string | null) => {
            if (!t) return null
            const [h, m] = t.split(':').map(Number)
            return h * 60 + m
        }

        const dayMap = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
        const dayKey = dayMap[dayDate.getDay()];

        let shopStartVal = 480; // default 08:00
        let shopEndVal = 1200; // default 20:00

        // 1. Verificação Global da Barbearia (Opening Hours)
        if (barbershopSettings?.opening_hours) {
            const shopDayConfig = barbershopSettings.opening_hours[dayKey]

            if (shopDayConfig) {
                // Se está fechado no dia
                if (shopDayConfig.open === false) return true

                // Se está fora do horário de funcionamento da BARBEARIA
                const shopStart = parseTime(shopDayConfig.start)
                const shopEnd = parseTime(shopDayConfig.end)
                if (shopStart !== null) shopStartVal = shopStart;
                if (shopEnd !== null) shopEndVal = shopEnd;

                if (shopStart !== null && timeVal < shopStart) return true
                if (shopEnd !== null && timeVal >= shopEnd) return true
            }
        }

        // 2. Verificação de Dias Individuais do Barbeiro
        if (barber.working_hours) {
            const barberDayConfig = barber.working_hours[dayKey]
            if (barberDayConfig && barberDayConfig.open === false) {
                return true
            }
        }

        // 3. Verificação de Almoço (Barbeiro tem prioridade sobre Barbearia)
        const barberLunchStart = parseTime(barber.lunch_start)
        const barberLunchEnd = parseTime(barber.lunch_end)

        if (barberLunchStart !== null && barberLunchEnd !== null) {
            if (timeVal >= barberLunchStart && timeVal < barberLunchEnd) return true
        } else if (barbershopSettings?.opening_hours) {
            const shopDayConfig = barbershopSettings.opening_hours[dayKey]
            if (shopDayConfig) {
                const shopLunchStart = parseTime(shopDayConfig.lunchStart)
                const shopLunchEnd = parseTime(shopDayConfig.lunchEnd)
                if (shopLunchStart !== null && shopLunchEnd !== null) {
                    if (timeVal >= shopLunchStart && timeVal < shopLunchEnd) return true
                }
            }
        }

        // 4. Verificação de Horário do Barbeiro
        const start = parseTime(barber.work_start) ?? shopStartVal;
        const end = parseTime(barber.work_end) ?? shopEndVal;

        // Fora do horário de trabalho do barbeiro
        if (timeVal < start || timeVal >= end) return true

        return false
    }

    // Helper para verificar se o slot está ocupado por um agendamento longo
    const isSlotOccupiedByPrevious = (barber_id: string, time: string, dayDate?: Date) => {
        const [targetH, targetM] = time.split(':').map(Number);
        const targetTotalMinutes = targetH * 60 + targetM;
        const dateStr = format(dayDate || date, 'yyyy-MM-dd')

        return bookings.some(b => {
            if (b.barber_id !== barber_id) return false;
            const bDate = b.date; // already YYYY-MM-DD
            if (bDate !== dateStr) return false;

            const [startH, startM] = b.time.split(':').map(Number);
            const startTotalMinutes = startH * 60 + startM;
            const endTotalMinutes = startTotalMinutes + b.duration;

            const slotStart = targetTotalMinutes;
            
            // O slot está "ocupado por um anterior" se o booking começou ANTES deste slot
            // E termina DEPOIS do início deste slot.
            return startTotalMinutes < slotStart && endTotalMinutes > slotStart;
        });
    }

    const handleSlotClick = (barber_id: string, time: string, dayDate: Date = date) => {
        const barber = barbers.find(b => b.id === barber_id)
        if (isBarberOffline(barber, time, dayDate)) return

        setSelectedSlot({ barber_id, time })
        setIsManualBookingModalOpen(true)
    }

    const handleToggleLock = async (barber_id: string, time: string, dayDate: Date = date, existingBooking?: any) => {
        if (existingBooking && existingBooking.id?.startsWith('block-')) {
            const blockId = existingBooking.id.substring(6, 42); // extract 36-char UUID after 'block-'
            if (confirm("Deseja remover este bloqueio?")) {
                console.log('Deleting schedule block with ID:', blockId, 'from compound ID:', existingBooking.id);
                const { error } = await supabase.from('schedule_blocks').delete().eq('id', blockId);
                if (error) console.error('Error deleting schedule block:', error);
                fetchData(false);
            }
            return;
        } else if (existingBooking && existingBooking.status === 'locked') {
            const { error } = await supabase.from('bookings').delete().eq('id', existingBooking.id);
            fetchData(false);
            return;
        }

        setSelectedSlot({ barber_id, time });
        setIsScheduleBlockModalOpen(true);
    }

    if (loading && barbers.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-primary)]" />
            </div>
        )
    }

    const currentBarberForWeakly = barbers.find(b => b.id === selectedBarberId) || barbers[0];

    const getActiveWeekDays = () => {
        const days = getWeekDays();
        if (view === 'daily') return days;

        return days.filter(day => {
            const dayMap = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
            const dayKey = dayMap[day.getDay()];
            const barber = currentBarberForWeakly;

            // 1. Check barber's individual working days if available
            if (barber?.working_hours && barber.working_hours[dayKey]) {
                return barber.working_hours[dayKey].open !== false;
            }

            // 2. Fallback to barbershop's opening hours
            const shopConfig = barbershopSettings?.opening_hours?.[dayKey];
            if (shopConfig) {
                return shopConfig.open !== false;
            }

            return true;
        });
    }

    const activeWeekDays = getActiveWeekDays();

    const colsCount = view === 'daily' ? barbers.length : activeWeekDays.length;
    const gridColsStyle = {
        display: 'grid',
        gridTemplateColumns: `80px repeat(${colsCount}, minmax(180px, 1fr))`
    };

    return (
        <div className="flex flex-col h-full bg-[var(--bg-page)] border border-[var(--border-color)] rounded-2xl shadow-2xl relative overflow-hidden">
                {/* Toolbar Top - Refatorada UX/UI Mobile First */}
                <div className="z-30 flex flex-col xl:flex-row xl:items-center justify-between p-3 sm:p-4 border-b border-[var(--border-color)] bg-[var(--bg-page)] backdrop-blur-md gap-4 sm:gap-5">
                    {/* TOP CONTAINER: Views & Date */}
                    <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4 xl:gap-6 w-full xl:w-auto">
                        {/* Grupo 1: Toggle View & Select Barbeiro */}
                        <div className="flex items-center justify-between md:justify-start gap-4 flex-wrap w-full md:w-auto">
                            <div className="flex items-center gap-1 bg-[var(--bg-card)] p-1 rounded-xl border border-[var(--border-color)] text-[11px] font-bold uppercase tracking-wider backdrop-blur-sm shrink-0">
                                <button
                                    onClick={() => setView('daily')}
                                    className={`px-4 py-1.5 rounded-lg transition-all duration-300 ${view === 'daily' ? 'bg-[#DBC278] text-black shadow-[0_0_15px_rgba(219,194,120,0.2)]' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'}`}
                                >
                                    Diário
                                </button>
                                <button
                                    onClick={() => setView('weekly')}
                                    className={`px-4 py-1.5 rounded-lg transition-all duration-300 ${view === 'weekly' ? 'bg-[#DBC278] text-black shadow-[0_0_15px_rgba(219,194,120,0.2)]' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'}`}
                                >
                                    Semanal
                                </button>
                            </div>
                            {view === 'weekly' && (
                                <div className="flex items-center gap-2 shrink-0">
                                    <Select value={selectedBarberId || ""} onValueChange={setSelectedBarberId}>
                                        <SelectTrigger className="w-[140px] sm:w-[180px] h-9 bg-[var(--bg-card)] border-[var(--border-color)] text-xs font-bold text-[var(--text-primary)] focus:ring-[#DBC278]/20 rounded-xl">
                                            <SelectValue placeholder="Barbeiro" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-primary)] rounded-xl">
                                            {barbers.map(b => (
                                                <SelectItem key={b.id} value={b.id} className="text-xs focus:bg-[#DBC278]/20 focus:text-white rounded-lg cursor-pointer">
                                                    {b.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>
                        {/* Grupo 2: Navegação de Data + Hoje */}
                        <div className="flex items-center justify-between sm:justify-center w-full md:w-auto p-1 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] backdrop-blur-sm self-start shrink-0">
                            <div className="flex items-center gap-1">
                                <Button size="icon" variant="ghost" className="w-9 h-9 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors active:scale-95" onClick={() => navigateDate(view === 'daily' ? -1 : -7)}>
                                    <ChevronLeft className="w-5 h-5" />
                                </Button>
                                <button
                                    onClick={() => setIsCalendarOpen(true)}
                                    className="h-9 px-3 text-xs sm:text-sm font-black text-[var(--text-primary)] hover:text-[var(--accent-primary)] transition-colors flex items-center justify-center gap-2 rounded-xl hover:bg-[var(--bg-hover)] grow"
                                >
                                    <CalendarIcon className="w-4 h-4 text-[#DBC278]" />
                                    <span className="capitalize">{format(date, view === 'daily' ? "EEE, dd MMM" : "'Sem.' dd MMM", { locale: ptBR })}</span>
                                </button>
                                <Button size="icon" variant="ghost" className="w-9 h-9 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors active:scale-95" onClick={() => navigateDate(view === 'daily' ? 1 : 7)}>
                                    <ChevronRight className="w-5 h-5" />
                                </Button>
                            </div>
                            <div className="w-px h-5 bg-white/10 hidden sm:block mx-1" />
                            <Button
                                size="sm"
                                variant="outline"
                                className={`h-9 px-4 mr-1 text-[10px] font-black tracking-widest uppercase rounded-xl border-dashed transition-all duration-300 active:scale-95 ${isSameDay(date, new Date()) ? 'text-[#DBC278] bg-[#DBC278]/10 border-[#DBC278]/30 hover:bg-[#DBC278]/20 hover:border-[#DBC278]/50' : 'text-[var(--text-muted)] border-[var(--border-color)] hover:text-[var(--text-primary)] hover:border-[var(--text-secondary)] bg-transparent'}`}
                                onClick={() => setDate(new Date())}
                            >
                                Hoje
                            </Button>
                        </div>
                    </div>
                    {/* Grupo 3: Botões de Ação */}
                    <div className="grid grid-cols-2 lg:flex lg:flex-row gap-3 w-full xl:w-auto">
                        <Button
                            size="sm"
                            variant="ghost"
                            className="w-full lg:w-[140px] h-12 lg:h-11 text-xs font-bold rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 border border-red-500/10 active:scale-[0.97]"
                            onClick={() => { setSelectedSlot(null); setIsScheduleBlockModalOpen(true); }}
                        >
                            <Lock className="w-4 h-4" />
                            <span className="truncate">Bloquear</span>
                        </Button>
                        <Button
                            size="sm"
                            className="w-full lg:w-[220px] h-12 lg:h-11 bg-green-500 hover:bg-green-400 text-black font-black text-xs rounded-2xl shadow-[0_0_20px_rgba(34,197,94,0.15)] hover:shadow-[0_0_25px_rgba(34,197,94,0.3)] transition-all duration-300 active:scale-[0.97] flex items-center justify-center gap-2 group border border-green-400/20"
                            onClick={() => setIsManualBookingModalOpen(true)}
                        >
                            <Plus className="w-4 h-4 transition-transform duration-300 group-hover:rotate-90 group-hover:scale-110" />
                            <span className="truncate">Novo Agendamento</span>
                        </Button>
                    </div>
                </div>

            <div className="flex-1 overflow-auto relative custom-scrollbar bg-[var(--bg-page)] scroll-smooth antialiased" style={{ WebkitOverflowScrolling: 'touch' }}>
                <div className="min-w-fit sm:min-w-[800px]">
                    {/* Header Columns */}
                    <div className="sticky top-0 z-[60] bg-[var(--bg-card)] backdrop-blur-md border-b border-[var(--border-color)]" style={gridColsStyle}>
                        <div className="border-r border-[var(--border-color)]" />

                        {view === 'daily' ? (
                            barbers.map(barber => {
                                const barberBookings = bookings.filter(b => b.barber_id === barber.id && b.status !== 'cancelled' && b.status !== 'locked');
                                const totalEarnings = barberBookings.reduce((sum, b) => {
                                    if (b.status === 'completed' || b.status === 'confirmed') {
                                        return sum + parseFloat(b.price || '0');
                                    }
                                    return sum;
                                }, 0);
                                const totalBookings = barberBookings.filter(b => b.status === 'completed' || b.status === 'confirmed').length;

                                return (
                                    <div key={barber.id} className="border-r border-[var(--border-color)] py-4 flex flex-col items-center justify-center gap-2 group-hover:bg-[var(--hover-bg)] transition-all">
                                        <Avatar className="w-10 h-10 border-2 border-[var(--accent-primary)]/30 shadow-lg shadow-[var(--accent-primary)]/5 transition-transform group-hover:scale-110">
                                            <AvatarImage src={barber.photo_url} />
                                            <AvatarFallback className="bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] text-xs font-black">{barber.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <div className="text-center">
                                            <p className="text-sm font-black text-[var(--text-primary)] leading-none uppercase tracking-tighter">{barber.name}</p>
                                            <div className="flex flex-col items-center mt-1.5 opacity-80">
                                                <p className="text-[10px] text-[var(--text-secondary)] font-bold leading-tight">{totalBookings} atendimentos</p>
                                                <p className="text-[10px] text-[var(--accent-primary)] font-bold leading-tight">R$ {totalEarnings.toFixed(2)}</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            activeWeekDays.map(day => (
                                <div key={day.toISOString()} className={`border-r border-[var(--border-color)] py-3 px-2 text-center flex flex-col items-center justify-center gap-1.5 ${isSameDay(day, new Date()) ? 'bg-[var(--accent-primary)]/10' : ''}`}>
                                    <span className="text-[10px] text-[var(--text-secondary)] font-black uppercase tracking-[0.2em] leading-none">{format(day, 'EEE', { locale: ptBR })}</span>
                                    <span className={`text-xl font-black leading-none tracking-tighter ${isSameDay(day, new Date()) ? 'text-[var(--accent-primary)]' : 'text-[var(--text-primary)]'}`}>{format(day, 'dd')}</span>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Body Slots */}
                    <div className="relative">
                        {timeSlots.filter(time => {
                            if (view === 'daily') {
                                return barbers.some(barber => !isBarberOffline(barber, time, date));
                            } else {
                                const barber = barbers.find(b => b.id === selectedBarberId);
                                if (!barber) return true;
                                return activeWeekDays.some(day => !isBarberOffline(barber, time, day));
                            }
                        }).map((time, index, filteredArr) => {
                            const currentHour = parseInt(time.split(':')[0]);
                            const prevTime = index > 0 ? filteredArr[index - 1] : null;
                            const prevHour = prevTime ? parseInt(prevTime.split(':')[0]) : null;

                            const showSeparator = prevHour !== null && prevHour < 12 && currentHour >= 12;

                            return (
                                <div key={time}>
                                    {showSeparator && (
                                        <div className="col-span-full flex items-center gap-3 py-4 px-4 bg-[var(--bg-card)] border-y border-[var(--border-color)] shadow-inner">
                                            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[var(--border-color)] to-transparent" />
                                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--bg-input)] border border-[var(--border-color)] backdrop-blur-md">
                                                <span className="text-[10px] sm:text-xs font-black text-amber-500 uppercase tracking-widest flex items-center gap-1.5">
                                                    Manhã
                                                </span>
                                                <div className="w-1 h-1 rounded-full bg-[var(--border-color)]" />
                                                <span className="text-[10px] sm:text-xs font-black text-blue-400 uppercase tracking-widest flex items-center gap-1.5">
                                                    Tarde
                                                </span>
                                            </div>
                                            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[var(--border-color)] to-transparent" />
                                        </div>
                                    )}
                                    <div className="border-b border-[var(--border-color)] group/row relative" style={gridColsStyle}>
                                        {/* Linha de Tempo Atual */}
                                        {isSameDay(date, new Date()) && view === 'daily' && (
                                            <CurrentTimeLine timeStr={time} />
                                        )}
                                        {/* Time Column */}
                                        <div className="border-r border-[var(--border-color)] h-[64px] flex flex-col items-center justify-center bg-[var(--bg-sidebar)] group-hover/row:bg-[var(--hover-bg)] transition-colors">
                                            <span className="text-xs font-bold text-[var(--text-muted)] group-hover/row:text-[var(--accent-primary)] transition-colors">{time}</span>
                                        </div>

                                        {/* Barber Slots (Daily) or Days Slots (Weekly) */}
                                        {view === 'daily' ? (
                                            barbers.map(barber => {
                                                const booking = getBookingInSlot(barber.id, time);
                                                const isOccupied = isSlotOccupiedByPrevious(barber.id, time);
                                                const isOffline = isBarberOffline(barber, time);

                                                if (isOccupied) return (
                                                    <div key={barber.id} className="border-r border-[var(--border-color)] relative bg-[var(--bg-input)]" />
                                                );

                                                return (
                                                    <SlotCell
                                                        key={barber.id}
                                                        barber={barber}
                                                        time={time}
                                                        booking={booking}
                                                        isOffline={isOffline}
                                                        onClick={() => handleSlotClick(barber.id, time)}
                                                        onToggleLock={() => handleToggleLock(barber.id, time, date, booking)}
                                                        onBookingClick={setActionBooking}
                                                    />
                                                );
                                            })
                                        ) : (
                                            activeWeekDays.map(day => {
                                                const barber = currentBarberForWeakly;
                                                if (!barber) return <div key={day.toISOString()} className="border-r border-white/5" />;

                                                const booking = getBookingInSlot(barber.id, time, day);
                                                const isOccupied = isSlotOccupiedByPrevious(barber.id, time, day);
                                                const isOffline = isBarberOffline(barber, time, day);

                                                if (isOccupied) return (
                                                    <div key={day.toISOString()} className={`border-r border-[var(--border-color)] relative bg-[var(--bg-input)] ${isSameDay(day, new Date()) ? 'bg-[var(--accent-primary)]/5' : ''}`} />
                                                );

                                                return (
                                                    <SlotCell
                                                        key={day.toISOString()}
                                                        barber={barber}
                                                        time={time}
                                                        booking={booking}
                                                        isOffline={isOffline}
                                                        dayDate={day}
                                                        onClick={() => handleSlotClick(barber.id, time, day)}
                                                        onToggleLock={() => handleToggleLock(barber.id, time, day, booking)}
                                                        onBookingClick={setActionBooking}
                                                    />
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Footer / Info */}
                <div className="p-3 border-t border-white/5 bg-zinc-950/50 flex flex-wrap items-center justify-center gap-4 sm:gap-6">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[var(--accent-primary)]" />
                    <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">Confirmado</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-600" />
                    <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">Pendente</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[var(--text-muted)]" />
                    <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">Concluído</span>
                </div>
            </div>

            {/* Modals */}
            <CreateScheduleBlockModal
                isOpen={isScheduleBlockModalOpen}
                onOpenChange={setIsScheduleBlockModalOpen}
                slug={slug}
                barbers={barbers}
                onSuccess={() => fetchData()}
                defaultDate={format(date, 'yyyy-MM-dd')}
                defaultTime={selectedSlot?.time}
                defaultBarberId={selectedSlot?.barber_id}
            />

            <CreateManualBookingModal
                isOpen={isManualBookingModalOpen}
                onOpenChange={setIsManualBookingModalOpen}
                slug={slug}
                onSuccess={() => fetchData()}
                initialDate={date}
                defaultBarberId={selectedSlot?.barber_id}
                defaultTime={selectedSlot?.time}
            />

            <Dialog open={!!actionBooking} onOpenChange={(open) => {
                if (!open) {
                    setActionBooking(null)
                    setIsFaturando(false)
                }
            }}>
                <DialogContent className="max-w-md bg-[var(--bg-card)] border-[var(--border-color)] p-6 gap-6 rounded-3xl">
                    <DialogHeader className="text-left space-y-4">
                        <div className="flex items-center justify-between">
                            <DialogTitle className="text-xl font-black text-[var(--text-primary)]">Agendamento</DialogTitle>
                        </div>
                        {actionBooking && (
                            <div className="flex items-center gap-4 bg-[var(--bg-input)] p-4 rounded-2xl border border-[var(--border-color)] relative">
                                <Avatar className="w-12 h-12 border-2 border-[var(--accent-primary)]/20 bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]">
                                    <AvatarFallback className="font-bold">
                                        {actionBooking.customer_name.substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="space-y-1">
                                    <h4 className="font-black text-[var(--text-primary)] leading-none capitalize text-lg">
                                        {actionBooking.customer_name}
                                    </h4>
                                    <p className="text-sm font-bold text-[var(--text-secondary)] capitalize">
                                        1x {actionBooking.barber_data?.name?.split(' ')[0]} - {actionBooking.service_title.split(' ')[0]}
                                    </p>
                                </div>

                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)] px-2 flex flex-col items-center gap-1 h-auto py-1.5"
                                    onClick={() => setIsEditModalOpen(true)}
                                >
                                    <Pencil className="w-4 h-4" />
                                    <span className="text-[9px] font-black uppercase tracking-widest">Editar</span>
                                </Button>
                            </div>
                        )}
                    </DialogHeader>

                    {actionBooking && (
                        <div className="flex flex-col gap-6">
                            <div className="space-y-3">
                                <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest pl-1">
                                    {isFaturando ? "Meio de Pagamento" : "Status do Agendamento"}
                                </p>
                                <div className="space-y-2">
                                    {!isFaturando ? (
                                        actionBooking.status === 'completed' ? (
                                            <Button
                                                variant="outline"
                                                className="w-full justify-start h-12 text-[var(--danger-color)] border-[var(--danger-color)]/20 hover:bg-[var(--danger-color)]/10 font-black gap-3 shadow-lg shadow-[var(--danger-color)]/5"
                                                onClick={() => handleRefund(actionBooking.id, actionBooking.command_id)}
                                            >
                                                <ArrowLeft className="w-5 h-5" />
                                                Estornar Comanda (↩)
                                            </Button>
                                        ) : (
                                            <>
                                                <Button
                                                    variant="outline"
                                                    className="w-full justify-start h-12 text-[var(--accent-primary)] border-[var(--accent-primary)]/20 hover:bg-[var(--accent-primary)]/10 font-bold gap-3"
                                                    onClick={() => setIsEditModalOpen(true)}
                                                >
                                                    <Scissors className="w-5 h-5" />
                                                    Editar serviços
                                                </Button>

                                                <Button
                                                    variant="outline"
                                                    className="w-full justify-start h-12 text-[var(--success-color)] border-[var(--success-color)]/20 hover:bg-[var(--success-color)]/10 font-black gap-3 bg-[var(--success-color)]/5 shadow-xl shadow-[var(--success-color)]/5 ring-1 ring-[var(--success-color)]/20"
                                                    onClick={() => setIsFaturando(true)}
                                                >
                                                    <CheckCircle className="w-5 h-5" />
                                                    Finalizar e Faturar
                                                </Button>

                                                <Button
                                                    variant="outline"
                                                    className="w-full justify-start h-12 text-[var(--accent-primary)] border-[var(--accent-primary)]/20 hover:bg-[var(--accent-primary)]/10 font-bold gap-3"
                                                    onClick={() => router.push(`/${slug}/admin/pdv?booking_id=${actionBooking.id}`)}
                                                >
                                                    <ShoppingCart className="w-5 h-5" />
                                                    Abrir no PDV
                                                </Button>

                                                <Button
                                                    variant="outline"
                                                    className="w-full justify-start h-12 text-[var(--danger-color)] border-[var(--danger-color)]/20 hover:bg-[var(--danger-color)]/10 font-bold gap-3"
                                                    onClick={() => {
                                                        if (confirm("Deseja realmente desmarcar este agendamento?")) {
                                                            updateStatus(actionBooking.id, 'cancelled')
                                                        }
                                                    }}
                                                >
                                                    <X className="w-5 h-5" />
                                                    Desmarcar
                                                </Button>
                                            </>
                                        )
                                    ) : (
                                        <>
                                            <Button
                                                variant="outline"
                                                className="w-full justify-start h-12 text-[#00b4d8] border-[#00b4d8]/20 hover:bg-[#00b4d8]/10 font-black gap-3"
                                                onClick={() => updateStatus(actionBooking.id, 'completed', 'pix')}
                                            >
                                                <QrCode className="w-5 h-5" />
                                                PIX
                                            </Button>

                                            <Button
                                                variant="outline"
                                                className="w-full justify-start h-12 text-[#e0aaff] border-[#e0aaff]/20 hover:bg-[#e0aaff]/10 font-black gap-3"
                                                onClick={() => updateStatus(actionBooking.id, 'completed', 'credit')}
                                            >
                                                <CreditCard className="w-5 h-5" />
                                                Cartão de Crédito
                                            </Button>

                                            <Button
                                                variant="outline"
                                                className="w-full justify-start h-12 text-[var(--success-color)] border-[var(--success-color)]/20 hover:bg-[var(--success-color)]/10 font-black gap-3"
                                                onClick={() => updateStatus(actionBooking.id, 'completed', 'cash')}
                                            >
                                                <Banknote className="w-5 h-5" />
                                                Dinheiro
                                            </Button>

                                            <Button
                                                variant="ghost"
                                                className="w-full justify-start h-12 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)] font-bold gap-3 mt-2"
                                                onClick={() => setIsFaturando(false)}
                                            >
                                                <ArrowLeft className="w-5 h-5" />
                                                Voltar
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-3 pt-6 border-t border-[var(--border-color)]">
                                <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest pl-1">Envio de Mensagem / Registro</p>
                                <div className="space-y-2">
                                    <Button
                                        variant="outline"
                                        className="w-full justify-start h-12 bg-[#25D366] hover:bg-[#25D366]/90 text-white border-transparent font-black gap-3 shadow-lg shadow-[#25D366]/20 transition-all"
                                        onClick={() => {
                                            const cleanPhone = actionBooking.customer_phone.replace(/\D/g, '')
                                            window.open(`https://wa.me/55${cleanPhone}`, '_blank')
                                        }}
                                    >
                                        <MessageSquare className="w-5 h-5" />
                                        Chamar no WhatsApp
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {isCalendarOpen && (
                <FullCalendarModal
                    selectedDate={date}
                    onSelect={(d: Date) => {
                        setDate(d)
                        setIsCalendarOpen(false)
                    }}
                    onClose={() => setIsCalendarOpen(false)}
                />
            )}

            {isEditModalOpen && actionBooking && (
                <EditBookingModal
                    isOpen={isEditModalOpen}
                    onOpenChange={setIsEditModalOpen}
                    booking={actionBooking}
                    slug={slug}
                    onSuccess={() => {
                        fetchData()
                        setActionBooking(null)
                    }}
                />
            )}
            </div>
        </div>
    )
}

// Subcomponente para organizar a célula do slot
function SlotCell({ barber, time, booking, isOffline, onClick, dayDate, onToggleLock, onBookingClick }: any) {
    const timeStep = 15; // minutos (deve ser o mesmo do pai)
    const slotHeight = 64; // pixels (deve ser o mesmo do pai h-[64px])
    const isToday = dayDate ? isSameDay(dayDate, new Date()) : false;

    // Cálculo de posicionamento dinâmico
    let top = 2; // Offset padrão
    let height = slotHeight - 4; // Altura padrão

    if (booking) {
        const [slotH, slotM] = time.split(':').map(Number);
        const slotStart = slotH * 60 + slotM;

        const [startH, startM] = booking.time.split(':').map(Number);
        const startTotal = startH * 60 + startM;

        // Offset do topo baseado nos minutos iniciais em relação ao slot
        const diffMinutes = Math.max(0, startTotal - slotStart);
        top = (diffMinutes / timeStep) * slotHeight + 2;

        // Altura proporcional à duração
        height = (booking.duration / timeStep) * slotHeight - 4;
    }

    return (
        <div
            className={`border-r border-[var(--border-color)] relative p-1 group/slot transition-all duration-300
                ${booking || isOffline ? '' : 'hover:bg-[var(--hover-bg)] cursor-pointer'}
                ${isOffline ? 'bg-black/30 stripe-bg pointer-events-none' : ''}
                ${isToday ? 'bg-[var(--accent-primary)]/[0.02]' : ''}
            `}
            onClick={() => !booking && !isOffline && onClick()}
        >
            {isOffline && (
                <div className="absolute inset-0 flex items-center justify-center opacity-30 select-none">
                    <Lock className="w-3 h-3 text-[var(--text-muted)]" />
                </div>
            )}
            {booking && (
                <div
                    onClick={(e) => {
                        e.stopPropagation();
                        if (booking.status === 'locked' && onToggleLock) {
                            onToggleLock();
                        } else if (onBookingClick) {
                            onBookingClick(booking);
                        }
                    }}
                    className={`
                        absolute inset-x-1 bottom-auto rounded-[10px] p-1.5 sm:p-2 z-20 hover:z-50 overflow-hidden flex flex-col transition-all duration-200 border animate-in fade-in zoom-in-95
                        ${booking.status === 'locked'
                            ? 'bg-red-950/40 border-red-500/30 text-[var(--text-muted)] cursor-pointer pointer-events-auto'
                            : 'shadow-[0px_2px_6px_rgba(0,0,0,0.15)] sm:hover:scale-[1.03] sm:hover:shadow-[0px_6px_12px_rgba(0,0,0,0.30)] active:scale-[0.98] border-white/10'}
                        ${booking.status === 'completed' ? 'bg-[var(--bg-card)] text-[var(--text-muted)] border-[var(--border-color)]' :
                            booking.status === 'confirmed' ? 'bg-[var(--accent-primary)] text-black shadow-[var(--accent-primary)]/40 border-[var(--accent-primary)]' :
                                booking.status === 'locked' ? '' :
                                    'bg-[#00b4d8] text-white shadow-[#00b4d8]/40 border-[#00b4d8]'}
                    `}
                    style={{
                        top: `${top}px`,
                        height: `${height}px`,
                        minHeight: booking.status === 'locked' ? 'auto' : `${Math.min(height, 85)}px`
                    }}
                >
                    {booking.status === 'locked' ? (
                        <div className="flex flex-col items-center justify-center h-full gap-1 opacity-80 cursor-pointer pointer-events-auto">
                            <Lock className="w-5 h-5 text-[var(--danger-color)]" />
                        </div>
                    ) : (
                        <div className="flex flex-col h-full w-full pointer-events-none gap-0.5 overflow-hidden justify-between">
                            <div className="flex flex-col gap-0.5 sm:gap-1">
                                {/* Line 1: Nome do Cliente e Status */}
                                <div className="flex items-start justify-between gap-1 sm:gap-2 w-full">
                                    <div className="flex items-center gap-1 sm:gap-1.5 min-w-0 pr-1">
                                        <User className={`w-3 h-3 flex-shrink-0 ${booking.status === 'confirmed' ? 'text-black/70' : booking.status === 'completed' ? 'text-[var(--text-muted)]' : 'text-white/70'}`} />
                                        <span className="font-black text-[11px] sm:text-[13px] uppercase tracking-tight truncate flex items-center gap-1 text-inherit pt-[1px]">
                                            {booking.customer_name}
                                            {booking.is_vip && <Crown className={`w-3.5 h-3.5 flex-shrink-0 ${booking.status === 'confirmed' ? 'text-[#a18835] fill-[#a18835]' : 'text-[var(--accent-primary)] fill-[var(--accent-primary)]'}`} />}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1 flex-shrink-0 pt-[1px]">
                                        <Badge className={`text-[8px] sm:text-[9px] px-1 py-0 shadow-none border-none bg-black/10 ${booking.status === 'confirmed' ? 'text-black/80' : 'text-white/80'}`}>
                                            {booking.duration}m
                                        </Badge>
                                        {booking.status === 'confirmed' && <Check className="w-3.5 h-3.5 opacity-70" />}
                                    </div>
                                </div>

                                {/* Line 2: Telefone */}
                                <div className="flex items-center gap-1 sm:gap-1.5 opacity-90 min-w-0">
                                    <Phone className={`w-2.5 h-2.5 flex-shrink-0 ${booking.status === 'confirmed' ? 'text-black/60' : 'text-white/60'}`} />
                                    <span className={`text-[9px] sm:text-[11px] font-bold truncate tracking-tight ${booking.status === 'confirmed' ? 'text-black/70' : 'text-white/70'}`}>
                                        {booking.customer_phone}
                                    </span>
                                </div>

                                {/* Line 3: Serviço */}
                                <div className="flex items-center gap-1 sm:gap-1.5 opacity-90 min-w-0">
                                    <Scissors className={`w-2.5 h-2.5 flex-shrink-0 ${booking.status === 'confirmed' ? 'text-black/60' : 'text-white/60'}`} />
                                    <span className={`text-[9px] sm:text-[11px] font-bold truncate uppercase tracking-tight ${booking.status === 'confirmed' ? 'text-black/80' : 'text-white/80'}`}>
                                        {booking.service_title}
                                    </span>
                                </div>
                            </div>
                            
                            {/* Line 4: Horário */}
                            <div className="flex items-center justify-between border-t border-black/10 pt-1 mt-0.5 opacity-95">
                                <div className="flex items-center gap-1 sm:gap-1.5 bg-black/5 px-1 sm:px-1.5 py-0.5 rounded-md min-w-0">
                                    <Clock className={`w-2.5 h-2.5 flex-shrink-0 ${booking.status === 'confirmed' ? 'text-black/60' : 'text-white/60'}`} />
                                    <span className={`text-[8px] sm:text-[10px] font-black truncate tracking-wide ${booking.status === 'confirmed' ? 'text-black/80' : 'text-white/80'}`}>
                                        {booking.time} &rarr; {booking.end_time}
                                    </span>
                                </div>
                                {booking.status === 'completed' && (
                                    <span className="text-[7px] sm:text-[8px] font-black uppercase text-[var(--text-secondary)] border border-[var(--border-color)] px-1 rounded-sm bg-black/20">
                                        Concluído
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Stripe Effect for background */}
                    {booking.status !== 'locked' && <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(circle_at_top_right,white_10%,transparent_0%)] bg-[length:12px_12px]" />}
                </div>
            )}

            {!booking && (
                <div className="absolute inset-0 opacity-0 group-hover/slot:opacity-100 flex items-center justify-center gap-2 pointer-events-none transition-opacity bg-[var(--hover-bg)] backdrop-blur-[2px]">
                    <button
                        onClick={(e) => { e.stopPropagation(); onClick(); }}
                        className="p-1 sm:p-2 hover:bg-[var(--accent-primary)]/20 rounded-md text-[var(--accent-primary)] pointer-events-auto transition-colors"
                        title="Novo Agendamento"
                    >
                        <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onToggleLock && onToggleLock(); }}
                        className="p-1 sm:p-2 hover:bg-[var(--danger-color)]/20 rounded-md text-[var(--danger-color)] pointer-events-auto transition-colors"
                        title="Travar Horário"
                    >
                        <Lock className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                </div>
            )}
        </div>
    )
}

function CurrentTimeLine({ timeStr }: { timeStr: string }) {
    const [now, setNow] = useState(new Date())

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 60000)
        return () => clearInterval(timer)
    }, [])

    const [h, m] = timeStr.split(':').map(Number)
    const slotMinutes = h * 60 + m

    const nowH = now.getHours()
    const nowM = now.getMinutes()
    const nowMinutes = nowH * 60 + nowM

    // If current time falls within this 15min slot
    if (nowMinutes >= slotMinutes && nowMinutes < slotMinutes + 15) {
        const offset = ((nowMinutes - slotMinutes) / 15) * 100
        return (
            <div
                className="absolute left-0 right-0 z-30 pointer-events-none flex items-center"
                style={{ top: `${offset}%` }}
                id="current-time-line"
            >
                <div className="w-[80px] flex justify-center">
                    <div className="bg-[var(--danger-color)] text-white text-[9px] font-black px-1.5 py-0.5 rounded-md shadow-[0_0_12px_rgba(239,68,68,0.5)]">
                        AGORA
                    </div>
                </div>
                <div className="flex-1 h-[2px] bg-[var(--danger-color)] shadow-[0_0_8px_rgba(239,68,68,0.8)] relative">
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[var(--danger-color)] shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                </div>
            </div>
        )
    }

    return null
}
