"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, User, Calendar, Phone, Smartphone, AlertCircle } from "lucide-react"
import { Client } from "@/components/admin/birthdays/ClientCard"

interface ClientListProps {
    clients: Client[]
}

export function ClientList({ clients }: ClientListProps) {
    return (
        <Card className="bg-transparent border-none shadow-none mt-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-sm font-semibold uppercase tracking-widest text-yellow-400/80">Próximos Aniversariantes</h2>
            </div>
            <div className="overflow-x-auto bg-[var(--bg-card)] rounded-xl border border-yellow-400/10 ring-1 ring-yellow-400/5 transition-all duration-300" style={{ boxShadow: '0 0 20px rgba(250, 204, 21, 0.05)' }}>
                <table className="w-full text-sm text-left">
                    <thead className="bg-[var(--bg-card)] text-yellow-400/60 uppercase text-[10px] font-bold tracking-widest border-b border-yellow-400/10">
                        <tr>
                            <th className="px-6 py-4">Cliente</th>
                            <th className="px-6 py-4">Status & Visita</th>
                            <th className="hidden md:table-cell px-6 py-4 text-center">Métricas</th>
                            <th className="px-6 py-4 text-right">Ação</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-color)]">
                        {clients.length === 0 ? (
                            <tr><td colSpan={4} className="px-6 py-12 text-center text-[var(--text-muted)]">Nenhum cliente combina com a busca.</td></tr>
                        ) : (
                            clients.map((client) => {
                                const isVip = client.tags.includes('vip')
                                
                                return (
                                <tr
                                    key={client.id}
                                    className="hover:bg-[var(--bg-hover)] transition-all duration-300 group"
                                    style={{ transition: 'all 0.3s ease' }}
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-11 h-11 rounded-full bg-[var(--bg-card)] flex items-center justify-center text-xs font-bold text-yellow-400/80 border border-yellow-400/20 overflow-hidden transition-all duration-300 group-hover:border-yellow-400/40">
                                                {client.avatar ? (
                                                    <img src={client.avatar} alt={client.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all duration-300" />
                                                ) : (
                                                    <User className="w-5 h-5" />
                                                )}
                                            </div>
                                            <div className="flex flex-col gap-0.5">
                                                <div className="font-bold text-[var(--text-primary)] text-base flex items-center gap-2 transition-all duration-300">
                                                    {client.name}
                                                    {isVip && <Badge className="bg-yellow-400/15 text-yellow-400 border-yellow-400/30 hover:bg-yellow-400/25 transition-all duration-300">VIP</Badge>}
                                                </div>
                                                <div className="flex items-center gap-1 text-xs text-[var(--text-muted)] mt-0.5">
                                                    <Phone className="w-3 h-3"/>{client.phone}
                                                </div>
                                                {client.suggestion && (
                                                    <div className="flex items-center gap-1 mt-1 text-[10px] text-yellow-400/70 font-medium transition-all duration-300">
                                                        <AlertCircle className="w-3 h-3 text-yellow-400" /> {client.suggestion.text}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1 items-start">
                                            <span className="font-bold text-[var(--text-primary)] text-sm">Idade: {client.age} anos</span>
                                            <span className="text-xs text-[var(--text-muted)]">Últ. vez: {client.lastVisit}</span>
                                        </div>
                                    </td>
                                    <td className="hidden md:table-cell px-6 py-4 text-center">
                                        <div className="flex flex-col items-center">
                                            <span className="text-green-400 font-bold">{client.ltv} <span className="text-[10px] text-[var(--text-muted)] font-normal">LTV</span></span>
                                            <span className="text-xs text-[var(--text-muted)] mt-1 uppercase tracking-wider">{client.frequency}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Button
                                            size="sm"
                                            className="bg-green-500 hover:bg-green-400 text-white font-semibold rounded-md px-4 py-2 transition-all duration-300 hover:scale-105"
                                            style={{ boxShadow: '0 0 15px rgba(34, 197, 94, 0.25)' }}
                                            onClick={() => window.open(`https://wa.me/55${client.phone.replace(/\D/g, '')}?text=Olá ${client.name.split(' ')[0]}, feliz aniversário! 🎉`, '_blank')}
                                        >
                                            <Smartphone className="w-4 h-4 mr-2" />
                                            WhatsApp
                                        </Button>
                                    </td>
                                </tr>
                            )})
                        )}
                    </tbody>
                </table>
            </div>
        </Card>
    )
}
