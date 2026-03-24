"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Trophy, Target, Play } from "lucide-react"
import { Button } from "@/components/ui/button"

export function GamificationPanel() {
    return (
        <Card
            className="bg-[var(--bg-card)] border border-green-500/20 h-full relative overflow-hidden transition-all duration-300 hover:border-green-500/40"
            style={{ boxShadow: '0 0 25px rgba(34, 197, 94, 0.08)' }}
        >
            <div className="absolute top-0 right-0 p-6 opacity-[0.07] pointer-events-none">
                <Trophy className="w-32 h-32 text-green-400" />
            </div>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-green-400 relative z-10 transition-all duration-300">
                    <Target className="w-5 h-5" />
                    Meta de Conversão (Novembro)
                </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
                <div className="flex justify-between items-end mb-2">
                    <div className="text-3xl font-bold text-[var(--text-primary)]">5 <span className="text-sm font-normal text-[var(--text-muted)]">/ 10 resgates</span></div>
                    <div className="text-sm font-bold text-green-400">50%</div>
                </div>
                
                {/* ProgressBar com glow */}
                <div className="h-2.5 bg-[var(--bg-hover)] border border-[var(--border-color)] rounded-full w-full overflow-hidden transition-all duration-300">
                    <div
                        className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full transition-all duration-700"
                        style={{ width: '50%', boxShadow: '0 0 12px rgba(34, 197, 94, 0.5)' }}
                    ></div>
                </div>
                
                <p className="text-xs text-[var(--text-muted)] mt-4 leading-relaxed">
                    Transforme aniversários em faturamento. Faltam apenas <span className="text-green-400 font-semibold">5 clientes</span> para bater a meta de recuperação do mês.
                </p>

                <Button
                    className="w-full mt-6 bg-yellow-400 hover:bg-yellow-300 text-black font-bold transition-all duration-300 hover:scale-[1.02]"
                    style={{ boxShadow: '0 0 20px rgba(250, 204, 21, 0.25)' }}
                >
                    <Play className="w-4 h-4 mr-2" />
                    Iniciar Disparos de Hoje
                </Button>
            </CardContent>
        </Card>
    )
}
