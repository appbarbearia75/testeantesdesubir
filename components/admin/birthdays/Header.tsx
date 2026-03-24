"use client"

import { Gift, Sparkles } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

interface HeaderProps {
    filter: string
    onFilterChange: (val: string) => void
    searchQuery: string
    onSearchChange: (val: string) => void
}

export function Header({ filter, onFilterChange, searchQuery, onSearchChange }: HeaderProps) {
    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-3">
                <div
                    className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400/30 to-yellow-600/10 flex items-center justify-center border border-yellow-400/30 transition-all duration-300"
                    style={{ boxShadow: '0 0 30px rgba(250, 204, 21, 0.2)' }}
                >
                    <Gift className="w-6 h-6 text-yellow-400" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                        Aniversariantes
                        <Sparkles className="w-5 h-5 text-yellow-400 font-bold" />
                    </h1>
                    <p className="text-[var(--text-secondary)] text-sm mt-1">Identifique clientes que fazem aniversário e crie campanhas de fidelização.</p>
                </div>
            </div>

            <div className="flex bg-[var(--bg-card)] p-1 rounded-lg border border-yellow-400/10 w-fit transition-all duration-300">
                <button onClick={() => onFilterChange('hoje')} className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-300 ${filter === 'hoje' ? 'bg-yellow-400 text-black font-semibold shadow-md' : 'text-[var(--text-secondary)] hover:text-yellow-400'}`}>Hoje</button>
                <button onClick={() => onFilterChange('amanha')} className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-300 ${filter === 'amanha' ? 'bg-yellow-400 text-black font-semibold shadow-md' : 'text-[var(--text-secondary)] hover:text-yellow-400'}`}>Amanhã</button>
                <button onClick={() => onFilterChange('semana')} className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-300 ${filter === 'semana' ? 'bg-yellow-400 text-black font-semibold shadow-md' : 'text-[var(--text-secondary)] hover:text-yellow-400'}`}>Na Semana</button>
                <button onClick={() => onFilterChange('mes')} className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-300 ${filter === 'mes' ? 'bg-yellow-400 text-black font-semibold shadow-md' : 'text-[var(--text-secondary)] hover:text-yellow-400'}`}>No Mês</button>
            </div>

            <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <Input
                    placeholder="Buscar cliente..."
                    className="pl-9 bg-[var(--bg-card)] border-yellow-400/10 text-[var(--text-primary)] text-sm h-10 rounded-lg focus:border-yellow-400/50 w-full placeholder:text-[var(--text-muted)] transition-all duration-300"
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                />
            </div>
        </div>
    )
}
