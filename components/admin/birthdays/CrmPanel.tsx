"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Trophy, Target, Play, Send, Bot, Clock, MessageSquare, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface CrmPanelProps {
    metrics: {
        today: number
        tomorrow: number
        week: number
        potentialRevenue: number
        noContact: number
    }
}

export function CrmPanel({ metrics }: CrmPanelProps) {
    return (
        <div className="flex flex-col gap-6 lg:sticky lg:top-6">
            {/* ══════════ META DE CONVERSÃO ══════════ */}
            <Card
                className="bg-[var(--bg-card)] border border-green-500/15 relative overflow-hidden transition-all duration-300 hover:border-green-500/30"
                style={{ boxShadow: '0 0 25px rgba(34, 197, 94, 0.06)' }}
            >
                {/* Background decoration */}
                <div className="absolute top-0 right-0 p-4 opacity-[0.04] pointer-events-none">
                    <Trophy className="w-28 h-28 text-green-400" />
                </div>

                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base text-green-400 relative z-10">
                        <Target className="w-5 h-5" />
                        Meta de Conversão
                    </CardTitle>
                    <p className="text-xs text-[var(--text-muted)]">Novembro 2024</p>
                </CardHeader>

                <CardContent className="relative z-10 space-y-5">
                    {/* Metrics */}
                    <div>
                        <div className="flex justify-between items-end mb-2">
                            <div className="text-3xl font-black text-[var(--text-primary)]">
                                5 <span className="text-sm font-normal text-[var(--text-muted)]">/ 10 resgates</span>
                            </div>
                            <div className="text-lg font-bold text-green-400">50%</div>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="h-2.5 bg-[var(--bg-hover)] border border-[var(--border-color)] rounded-full w-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full transition-all duration-700"
                                style={{ width: '50%', boxShadow: '0 0 12px rgba(34, 197, 94, 0.4)' }}
                            />
                        </div>
                    </div>

                    <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                        Transforme aniversários em faturamento. Faltam apenas <span className="text-green-400 font-semibold">5 clientes</span> para bater a meta.
                    </p>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-[var(--bg-card)] rounded-lg p-3 border border-[var(--border-color)] transition-all duration-300">
                            <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold">Hoje</span>
                            <div className="text-xl font-black text-yellow-400 mt-0.5">{metrics.today}</div>
                        </div>
                        <div className="bg-[var(--bg-card)] rounded-lg p-3 border border-[var(--border-color)] transition-all duration-300">
                            <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold">Semana</span>
                            <div className="text-xl font-black text-blue-400 mt-0.5">{metrics.week}</div>
                        </div>
                    </div>

                    {/* CTA Button */}
                    <Button
                        className="w-full py-5 bg-yellow-400 hover:bg-yellow-300 text-black font-bold text-sm rounded-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                        style={{ boxShadow: '0 0 25px rgba(250, 204, 21, 0.3)' }}
                    >
                        <Send className="w-4 h-4 mr-2" />
                        Enviar mensagens de hoje
                    </Button>
                </CardContent>
            </Card>

            {/* ══════════ RÉGUA DE RELACIONAMENTO ══════════ */}
            <Card
                className="bg-[var(--bg-card)] border border-yellow-400/10 transition-all duration-300 hover:border-yellow-400/20"
                style={{ boxShadow: '0 0 15px rgba(250, 204, 21, 0.03)' }}
            >
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base text-[var(--text-primary)]">
                        <Bot className="w-5 h-5 text-yellow-400" />
                        Régua de Relacionamento
                    </CardTitle>
                    <p className="text-xs text-[var(--text-muted)]">Automação de mensagens</p>
                </CardHeader>

                <CardContent>
                    <div className="space-y-1">
                        {/* Step 1: 7 dias antes */}
                        <div className="flex gap-3 transition-all duration-300">
                            <div className="flex flex-col items-center">
                                <div className="w-9 h-9 rounded-full bg-indigo-500/15 flex items-center justify-center border border-indigo-500/25 transition-all duration-300">
                                    <Clock className="w-4 h-4 text-indigo-400" />
                                </div>
                                <div className="w-px flex-1 bg-[var(--border-color)] my-1.5" />
                            </div>
                            <div className="pb-5 flex-1">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-bold text-[var(--text-primary)]">7 dias antes</p>
                                    <Badge className="bg-[var(--bg-hover)] border-[var(--border-color)] text-[var(--text-muted)] text-[10px] h-5 hover:bg-[var(--bg-hover)] transition-all duration-300">
                                        Manual
                                    </Badge>
                                </div>
                                <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">Lembrete para agendar corte preparatório.</p>
                            </div>
                        </div>
                        
                        {/* Step 2: No dia */}
                        <div className="flex gap-3 transition-all duration-300">
                            <div className="flex flex-col items-center">
                                <div className="w-9 h-9 rounded-full bg-yellow-400/15 flex items-center justify-center border border-yellow-400/25 transition-all duration-300">
                                    <MessageSquare className="w-4 h-4 text-yellow-400" />
                                </div>
                                <div className="w-px flex-1 bg-[var(--border-color)] my-1.5" />
                            </div>
                            <div className="pb-5 flex-1">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-bold text-[var(--text-primary)]">No Dia</p>
                                    <Badge className="bg-yellow-400/10 border-yellow-400/20 text-yellow-400 text-[10px] h-5 hover:bg-yellow-400/20 transition-all duration-300">
                                        Ativo
                                    </Badge>
                                </div>
                                <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">Mensagem de feliz aniversário com presente virtual.</p>
                            </div>
                        </div>

                        {/* Step 3: Resgate */}
                        <div className="flex gap-3 transition-all duration-300">
                            <div className="flex flex-col items-center">
                                <div className="w-9 h-9 rounded-full bg-green-500/15 flex items-center justify-center border border-green-500/25 transition-all duration-300">
                                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                                </div>
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-bold text-[var(--text-primary)]">Resgate</p>
                                    <Badge className="bg-red-500/10 border-red-500/20 text-red-400 text-[10px] h-5 hover:bg-red-500/20 transition-all duration-300">
                                        Pausado
                                    </Badge>
                                </div>
                                <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">Gere link de benefício com validade para retorno.</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
