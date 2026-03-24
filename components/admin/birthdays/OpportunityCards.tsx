"use client"

import { Card, CardContent } from "@/components/ui/card"
import { AlertTriangle, CalendarDays, DollarSign } from "lucide-react"

interface OpportunityCardsProps {
    metrics: {
        today: number
        tomorrow: number
        week: number
        potentialRevenue: number
        noContact: number
    }
}

export function OpportunityCards({ metrics }: OpportunityCardsProps) {
    return (
        <section>
            {/* Section Header */}
            <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-lg bg-purple-500/15 flex items-center justify-center border border-purple-500/20">
                    <DollarSign className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                    <h2 className="text-base font-bold text-[var(--text-primary)]">Oportunidades</h2>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">Métricas importantes para ação</p>
                </div>
            </div>

            {/* 3 cards side by side */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Card: Clientes em Risco */}
                <Card
                    className="bg-[var(--bg-card)] border border-red-500/15 overflow-hidden transition-all duration-300 hover:border-red-500/30 group"
                    style={{ boxShadow: '0 0 20px rgba(239, 68, 68, 0.06)' }}
                >
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-red-400/80">Em Risco</span>
                            <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center border border-red-500/20 transition-all duration-300 group-hover:bg-red-500/20">
                                <AlertTriangle className="w-4 h-4 text-red-400" />
                            </div>
                        </div>
                        <div className="text-3xl font-black text-red-400" style={{ textShadow: '0 0 20px rgba(239, 68, 68, 0.3)' }}>8</div>
                        <p className="text-[11px] text-[var(--text-muted)] mt-1">Ausentes há +60 dias</p>
                    </CardContent>
                </Card>

                {/* Card: Esta Semana */}
                <Card
                    className="bg-[var(--bg-card)] border border-blue-500/15 overflow-hidden transition-all duration-300 hover:border-blue-500/30 group"
                    style={{ boxShadow: '0 0 20px rgba(59, 130, 246, 0.06)' }}
                >
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400/80">Esta Semana</span>
                            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20 transition-all duration-300 group-hover:bg-blue-500/20">
                                <CalendarDays className="w-4 h-4 text-blue-400" />
                            </div>
                        </div>
                        <div className="text-3xl font-black text-blue-400" style={{ textShadow: '0 0 20px rgba(59, 130, 246, 0.3)' }}>{metrics.week}</div>
                        <p className="text-[11px] text-[var(--text-muted)] mt-1">Aniversariantes na semana</p>
                    </CardContent>
                </Card>

                {/* Card: Receita Potencial */}
                <Card
                    className="bg-[var(--bg-card)] border border-green-500/15 overflow-hidden transition-all duration-300 hover:border-green-500/30 group"
                    style={{ boxShadow: '0 0 20px rgba(34, 197, 94, 0.06)' }}
                >
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-green-400/80">Receita Potencial</span>
                            <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center border border-green-500/20 transition-all duration-300 group-hover:bg-green-500/20">
                                <DollarSign className="w-4 h-4 text-green-400" />
                            </div>
                        </div>
                        <div className="text-3xl font-black text-green-400" style={{ textShadow: '0 0 20px rgba(34, 197, 94, 0.3)' }}>
                            R$ {metrics.potentialRevenue.toLocaleString('pt-BR')}
                        </div>
                        <p className="text-[11px] text-[var(--text-muted)] mt-1">Se 100% retornarem</p>
                    </CardContent>
                </Card>
            </div>
        </section>
    )
}
