"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Bot, Clock, MessageSquare, CheckCircle2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export function AutomationTimeline() {
    return (
        <Card
            className="bg-[var(--bg-card)] border border-yellow-400/10 h-full transition-all duration-300 hover:border-yellow-400/20"
            style={{ boxShadow: '0 0 20px rgba(250, 204, 21, 0.05)' }}
        >
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-[var(--text-primary)] transition-all duration-300">
                    <Bot className="w-5 h-5 text-yellow-400" />
                    Régua de Relacionamento <span className="text-xs text-[var(--text-muted)] font-normal">(Em breve)</span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    <div className="flex gap-4 transition-all duration-300">
                        <div className="flex flex-col items-center">
                            <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30 transition-all duration-300">
                                <Clock className="w-4 h-4 text-indigo-400" />
                            </div>
                            <div className="w-px h-full bg-[var(--border-color)] my-2" />
                        </div>
                        <div className="pb-6">
                            <p className="text-sm font-bold text-[var(--text-primary)]">7 dias antes</p>
                            <p className="text-xs text-[var(--text-muted)] mt-1">Lembrete para agendar corte preparatório.</p>
                            <Badge className="bg-[var(--bg-hover)] border-[var(--border-color)] text-[var(--text-muted)] mt-2 hover:bg-[var(--bg-hover)] transition-all duration-300">Desativado</Badge>
                        </div>
                    </div>
                    
                    <div className="flex gap-4 transition-all duration-300">
                        <div className="flex flex-col items-center">
                            <div className="w-8 h-8 rounded-full bg-yellow-400/20 flex items-center justify-center border border-yellow-400/30 transition-all duration-300">
                                <MessageSquare className="w-4 h-4 text-yellow-400" />
                            </div>
                            <div className="w-px h-full bg-[var(--border-color)] my-2" />
                        </div>
                        <div className="pb-6">
                            <p className="text-sm font-bold text-[var(--text-primary)]">No Dia</p>
                            <p className="text-xs text-[var(--text-muted)] mt-1">Mensagem de feliz aniversário com presente virtual.</p>
                            <Badge className="bg-[var(--bg-hover)] border-[var(--border-color)] text-[var(--text-muted)] mt-2 hover:bg-[var(--bg-hover)] transition-all duration-300">Desativado</Badge>
                        </div>
                    </div>

                    <div className="flex gap-4 transition-all duration-300">
                        <div className="flex flex-col items-center">
                            <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center border border-green-500/30 transition-all duration-300">
                                <CheckCircle2 className="w-4 h-4 text-green-400" />
                            </div>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-[var(--text-primary)]">Resgate</p>
                            <p className="text-xs text-[var(--text-muted)] mt-1">Gere link de benefício com validade para retorno.</p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
