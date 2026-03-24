"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Smartphone, User, Phone, Cake, Star, Clock } from "lucide-react"
import { Client } from "@/components/admin/birthdays/ClientCard"

interface TodayBirthdaysProps {
    clients: Client[]
    todayCount: number
}

function getAvatarColor(name: string): string {
    const colors = ['#FACC15', '#22C55E', '#3B82F6', '#A855F7', '#F97316', '#EC4899']
    return colors[name.charCodeAt(0) % colors.length]
}

function getInitials(name: string) {
    return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()
}

export function TodayBirthdays({ clients, todayCount }: TodayBirthdaysProps) {
    return (
        <section>
            {/* Section Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div
                        className="w-9 h-9 rounded-lg bg-yellow-400/15 flex items-center justify-center border border-yellow-400/20"
                        style={{ boxShadow: '0 0 15px rgba(250, 204, 21, 0.1)' }}
                    >
                        <Cake className="w-4 h-4 text-yellow-400" />
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                            Aniversariantes de Hoje
                            <span
                                className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-yellow-400 text-black text-[11px] font-black"
                                style={{ boxShadow: '0 0 10px rgba(250, 204, 21, 0.3)' }}
                            >
                                {todayCount}
                            </span>
                        </h2>
                        <p className="text-xs text-[var(--text-muted)] mt-0.5">Clientes que fazem aniversário hoje</p>
                    </div>
                </div>
            </div>

            {/* Client Cards */}
            <div className="space-y-3">
                {clients.length === 0 ? (
                    <Card
                        className="bg-[var(--bg-card)] border border-[var(--border-color)] p-8 text-center transition-all duration-300"
                    >
                        <Cake className="w-10 h-10 text-[var(--text-muted)] mx-auto mb-3" />
                        <p className="text-[var(--text-muted)] text-sm">Nenhum aniversariante encontrado para este filtro.</p>
                        <p className="text-[var(--text-muted)] text-xs mt-1">Tente outro período ou adicione datas de nascimento dos clientes.</p>
                    </Card>
                ) : (
                    clients.map((client) => {
                        const isVip = client.tags.includes('vip')
                        return (
                            <Card
                                key={client.id}
                                className="bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-yellow-400/20 p-4 transition-all duration-300 group"
                                style={{ transition: 'all 0.3s ease' }}
                            >
                                <div className="flex items-center justify-between gap-4">
                                    {/* Left: Avatar + Info */}
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                        {/* Avatar */}
                                        <div
                                            className="w-12 h-12 rounded-full flex items-center justify-center text-black font-bold text-sm shrink-0 transition-all duration-300 group-hover:scale-105"
                                            style={{
                                                background: getAvatarColor(client.name),
                                                boxShadow: `0 0 15px ${getAvatarColor(client.name)}40`
                                            }}
                                        >
                                            {getInitials(client.name)}
                                        </div>

                                        {/* Info */}
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-base font-semibold text-[var(--text-primary)] truncate">{client.name}</span>
                                                {isVip && (
                                                    <Badge className="bg-yellow-400/15 text-yellow-400 border border-yellow-400/30 text-[10px] px-1.5 py-0 h-5 font-bold gap-0.5">
                                                        <Star className="w-2.5 h-2.5" /> VIP
                                                    </Badge>
                                                )}
                                                <span className="text-xs text-[var(--text-muted)]">{client.age} anos</span>
                                            </div>
                                            <div className="flex items-center gap-4 mt-1">
                                                <span className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                                                    <Phone className="w-3 h-3" /> {client.phone}
                                                </span>
                                                <span className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                                                    <Clock className="w-3 h-3" /> {client.lastVisit}
                                                </span>
                                                <span className="text-xs font-semibold text-green-400">{client.ltv}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: Action */}
                                    <Button
                                        size="sm"
                                        className="bg-green-500 hover:bg-green-400 text-white font-semibold rounded-lg px-4 py-2 transition-all duration-300 hover:scale-105 shrink-0"
                                        style={{ boxShadow: '0 0 15px rgba(34, 197, 94, 0.25)' }}
                                        onClick={() => window.open(`https://wa.me/55${client.phone.replace(/\D/g, '')}?text=Olá ${client.name.split(' ')[0]}, feliz aniversário! 🎉`, '_blank')}
                                    >
                                        <Smartphone className="w-4 h-4 mr-1.5" />
                                        Enviar mensagem
                                    </Button>
                                </div>
                            </Card>
                        )
                    })
                )}
            </div>
        </section>
    )
}
