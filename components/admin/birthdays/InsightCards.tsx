"use client"

import { Card, CardContent, CardHeader, CardDescription } from "@/components/ui/card"
import { CalendarDays, Gift, TrendingUp, Users, Send } from "lucide-react"
import { Button } from "@/components/ui/button"

export interface BirthdayMetrics {
    today: number
    tomorrow: number
    week: number
    potentialRevenue: number
    noContact: number
}

export function InsightCards({ metrics }: { metrics: BirthdayMetrics }) {
    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-6 duration-700">
            {/* BOTÃO PRINCIPAL - MAIS CHAMATIVO DA TELA */}
            <Button
                className="w-full py-6 text-lg font-semibold rounded-lg bg-yellow-400 text-black hover:bg-yellow-300 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
                style={{ boxShadow: '0 0 25px rgba(250, 204, 21, 0.35), 0 0 50px rgba(250, 204, 21, 0.15)' }}
            >
                <Send className="w-5 h-5 mr-2" />
                Enviar mensagens de hoje ({metrics.today})
            </Button>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                {/* Card Aniversariantes Hoje/Semana */}
                <Card
                    className="bg-[var(--bg-card)] border border-yellow-400/20 relative overflow-hidden transition-all duration-300 hover:border-yellow-400/40"
                    style={{ boxShadow: '0 0 20px rgba(250, 204, 21, 0.1)' }}
                >
                    <CardHeader className="pb-2 flex flex-row items-center justify-between z-10 relative">
                        <CardDescription className="text-xs font-semibold uppercase tracking-wider text-yellow-400">Aniversariantes</CardDescription>
                        <CalendarDays className="w-4 h-4 text-yellow-400/60" />
                    </CardHeader>
                    <CardContent className="z-10 relative">
                        <div className="text-3xl font-bold text-yellow-400">{metrics.today} <span className="text-lg text-yellow-400/60">/ {metrics.week}</span></div>
                        <div className="text-xs text-[var(--text-secondary)] mt-1">Hoje / Na semana</div>
                    </CardContent>
                </Card>

                {/* Card Risco de Churn */}
                <Card
                    className="bg-[var(--bg-card)] border border-orange-500/20 relative overflow-hidden group transition-all duration-300 hover:border-orange-500/40"
                    style={{ boxShadow: '0 0 20px rgba(249, 115, 22, 0.08)' }}
                >
                    <div className="absolute right-0 top-0 w-1.5 h-full bg-orange-500/60 group-hover:bg-orange-500 transition-all duration-300" />
                    <CardHeader className="pb-2 flex flex-row items-center justify-between">
                        <CardDescription className="text-xs font-semibold uppercase tracking-wider text-orange-400">Em Risco de Churn</CardDescription>
                        <TrendingUp className="w-4 h-4 text-orange-400/60" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-orange-400 mb-1">8</div>
                        <div className="text-[10px] text-orange-300/50 uppercase tracking-wide">Ausentes {">"} 60 dias</div>
                    </CardContent>
                </Card>

                {/* Card Resgatados */}
                <Card
                    className="bg-[var(--bg-card)] border border-green-500/20 relative overflow-hidden transition-all duration-300 hover:border-green-500/40"
                    style={{ boxShadow: '0 0 20px rgba(34, 197, 94, 0.08)' }}
                >
                    <CardHeader className="pb-2 flex flex-row items-center justify-between">
                        <CardDescription className="text-xs font-semibold uppercase tracking-wider text-green-400">Resgatados (Últ. 30d)</CardDescription>
                        <Gift className="w-4 h-4 text-green-400/60" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-green-400">5</div>
                        <div className="text-[10px] text-green-300/50 uppercase tracking-wide mt-1">Taxa conversão: 18%</div>
                    </CardContent>
                </Card>

                {/* Card LTV */}
                <Card
                    className="bg-[var(--bg-card)] border border-yellow-400/20 relative overflow-hidden transition-all duration-300 hover:border-yellow-400/40"
                    style={{ boxShadow: '0 0 20px rgba(250, 204, 21, 0.08)' }}
                >
                    <CardHeader className="pb-2 flex flex-row items-center justify-between">
                        <CardDescription className="text-xs font-semibold uppercase tracking-wider text-yellow-400/80">Potencial LTV Em Jogo</CardDescription>
                        <Users className="w-4 h-4 text-yellow-400/60" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-green-400">R$ {metrics.potentialRevenue.toLocaleString('pt-BR')}</div>
                        <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide mt-1">Se 100% retornarem</div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
