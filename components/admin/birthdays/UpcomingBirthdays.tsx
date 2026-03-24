"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, ChevronRight, CalendarDays } from "lucide-react"
import { Client } from "@/components/admin/birthdays/ClientCard"

interface UpcomingBirthdaysProps {
    clients: Client[]
    weekCount: number
}

function getAvatarColor(name: string): string {
    const colors = ['#FACC15', '#22C55E', '#3B82F6', '#A855F7', '#F97316', '#EC4899']
    return colors[name.charCodeAt(0) % colors.length]
}

function getInitials(name: string) {
    return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()
}

// Generates mock upcoming dates for display purposes
function getMockUpcoming() {
    const now = new Date()
    return [
        { day: now.getDate() + 1, month: now.toLocaleString('pt-BR', { month: 'short' }), name: 'Mariana Silva', lastVisit: '14 dias', tag: 'VIP' },
        { day: now.getDate() + 2, month: now.toLocaleString('pt-BR', { month: 'short' }), name: 'Carlos Souza', lastVisit: '7 dias', tag: 'Frequente' },
        { day: now.getDate() + 4, month: now.toLocaleString('pt-BR', { month: 'short' }), name: 'Felipe Nunes', lastVisit: '22 dias', tag: null },
        { day: now.getDate() + 6, month: now.toLocaleString('pt-BR', { month: 'short' }), name: 'Rodrigo Lima', lastVisit: '3 dias', tag: 'VIP' },
    ]
}

export function UpcomingBirthdays({ clients, weekCount }: UpcomingBirthdaysProps) {
    const upcomingItems = clients.length > 0
        ? clients.map((c, i) => ({
            day: new Date().getDate() + i + 1,
            month: new Date().toLocaleString('pt-BR', { month: 'short' }),
            name: c.name,
            lastVisit: c.lastVisit,
            tag: c.tags.includes('vip') ? 'VIP' : null,
        }))
        : getMockUpcoming()

    return (
        <section>
            {/* Section Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-500/15 flex items-center justify-center border border-blue-500/20">
                        <CalendarDays className="w-4 h-4 text-blue-400" />
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                            Próximos 7 dias
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white text-[11px] font-black">
                                {weekCount || upcomingItems.length}
                            </span>
                        </h2>
                        <p className="text-xs text-[var(--text-muted)] mt-0.5">Aniversários que estão chegando</p>
                    </div>
                </div>
                <Button variant="ghost" size="sm" className="text-xs text-[var(--text-muted)] h-7 px-2 hover:text-yellow-400 gap-1 transition-all duration-300">
                    Ver todos <ChevronRight className="w-3 h-3" />
                </Button>
            </div>

            {/* Compact List */}
            <Card
                className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl overflow-hidden transition-all duration-300"
            >
                {upcomingItems.map((item, i) => (
                    <div
                        key={i}
                        className="flex items-center justify-between px-4 py-3 hover:bg-[var(--bg-hover)] transition-all duration-300 group border-b border-[var(--border-color)] last:border-0"
                    >
                        {/* Left: Date + Name */}
                        <div className="flex items-center gap-3 min-w-0">
                            {/* Date Pill */}
                            <div className="shrink-0 w-11 h-11 rounded-lg bg-[var(--bg-hover)] border border-[var(--border-color)] flex flex-col items-center justify-center group-hover:border-yellow-400/20 transition-all duration-300">
                                <span className="text-sm font-black text-[var(--text-primary)] leading-none">{item.day}</span>
                                <span className="text-[9px] text-[var(--text-muted)] font-semibold uppercase">{item.month}</span>
                            </div>

                            {/* Avatar + Name */}
                            <div className="flex items-center gap-2 min-w-0">
                                <div
                                    className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 transition-all duration-300"
                                    style={{ background: getAvatarColor(item.name), color: '#000' }}
                                >
                                    {getInitials(item.name)}
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-sm font-semibold text-[var(--text-primary)] truncate">{item.name}</span>
                                        {item.tag === 'VIP' && (
                                            <span className="text-[9px] font-black uppercase text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 px-1.5 py-0.5 rounded-md shrink-0">VIP</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1 mt-0.5">
                                        <Clock className="w-2.5 h-2.5 text-[var(--text-muted)]" />
                                        <span className="text-[11px] text-[var(--text-muted)]">Última visita: {item.lastVisit}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right: Action */}
                        <Button
                            size="sm"
                            variant="outline"
                            className="shrink-0 h-8 text-[11px] font-semibold border-[var(--border-color)] text-[var(--text-secondary)] hover:text-yellow-400 hover:border-yellow-400/30 hover:bg-yellow-400/5 rounded-lg px-3 opacity-0 group-hover:opacity-100 transition-all duration-300"
                        >
                            Agendar mensagem
                        </Button>
                    </div>
                ))}
            </Card>
        </section>
    )
}
