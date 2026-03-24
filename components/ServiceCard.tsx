"use client"

import { motion, AnimatePresence } from "framer-motion"
import React, { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { 
    Scissors, 
    Zap, 
    User, 
    Crown, 
    Eye, 
    Sparkles, 
    Sun, 
    Feather, 
    Droplet, 
    Smile
} from "lucide-react"

const iconMap: Record<string, any> = {
    scissors: Scissors,
    zap: Zap,
    user: User,
    crown: Crown,
    eye: Eye,
    sparkles: Sparkles,
    sun: Sun,
    feather: Feather,
    droplet: Droplet,
    smile: Smile
}

interface ServiceCardProps {
    id: string
    title: string
    price: number
    icon?: string
    duration?: string
    selected?: boolean
    onSelect: (id: string) => void
}

export function ServiceCard({
    id,
    title,
    price,
    icon,
    duration,
    selected,
    onSelect,
}: ServiceCardProps) {
    return (
        <div
            onClick={() => onSelect(id)}
            className={cn(
                "group flex items-center justify-between p-4 transition-all cursor-pointer rounded-xl border active:scale-[0.98]",
                selected
                    ? "bg-[#1c1c1c] border-[#DBC278]"
                    : "bg-[#1c1c1c] border-white/5 hover:border-zinc-700 shadow-sm"
            )}
        >
            {/* Left Content: Title & Info */}
            <div className="flex flex-col gap-0">
                <h3 className={cn("font-bold text-white text-[15px] flex items-center gap-2")}>
                    {icon && iconMap[icon] ? (
                        React.createElement(iconMap[icon], { className: "w-4 h-4 text-[#DBC278]" })
                    ) : (
                        icon && <span className="text-lg">{icon}</span>
                    )}
                    {title}
                </h3>
                <div className="flex items-center gap-3">
                    <span className="text-[13px] text-zinc-500">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price)}
                    </span>
                </div>
            </div>

            {/* Right Action: Indicator */}
            <div className="flex items-center gap-3">
                <button
                    className={cn(
                        "px-4 py-2 rounded-lg text-[13px] font-bold transition-all",
                        selected
                            ? "bg-transparent border border-[#DBC278] text-[#DBC278]"
                            : "bg-[#DBC278] text-black hover:bg-[#c4ad6b]"
                    )}
                >
                    {selected ? "Remover" : "Adicionar"}
                </button>
            </div>
        </div>
    )
}
