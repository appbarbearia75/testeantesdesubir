"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

interface WorkingHours {
    [key: string]: {
        open: boolean
        start: string
        end: string
        lunchStart?: string | null
        lunchEnd?: string | null
    }
}

interface WorkingHoursEditorProps {
    value: WorkingHours
    onChange: (value: WorkingHours) => void
}

const DAYS_TRANSLATION: { [key: string]: string } = {
    seg: "Segunda-feira",
    ter: "Terça-feira",
    qua: "Quarta-feira",
    qui: "Quinta-feira",
    sex: "Sexta-feira",
    sab: "Sábado",
    dom: "Domingo"
}

// Default order for display
const SORTED_DAYS = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom']

export function WorkingHoursEditor({ value, onChange }: WorkingHoursEditorProps) {

    const handleChange = (day: string, field: 'open' | 'start' | 'end' | 'lunchStart' | 'lunchEnd', newValue: any) => {
        const currentDay = value[day] || { open: false, start: "09:00", end: "18:00", lunchStart: null, lunchEnd: null }
        const updated = {
            ...value,
            [day]: {
                ...currentDay,
                [field]: newValue
            }
        }
        onChange(updated)
    }

    const handleTimeChange = (day: string, field: 'start' | 'end' | 'lunchStart' | 'lunchEnd', inputValue: string) => {
        const previousValue = value[day]?.[field] || ""
        
        if (inputValue.length < previousValue.length) {
            handleChange(day, field, inputValue)
            return
        }

        let numbers = inputValue.replace(/\D/g, "")
        if (numbers.length > 4) numbers = numbers.slice(0, 4)

        let formatted = numbers
        if (numbers.length > 2) {
            formatted = `${numbers.slice(0, 2)}:${numbers.slice(2)}`
        }

        handleChange(day, field, formatted)
    }

    const handleTimeBlur = (day: string, field: 'start' | 'end' | 'lunchStart' | 'lunchEnd', inputValue: string) => {
        if (!inputValue) return
        
        let numbers = inputValue.replace(/\D/g, "")
        if (!numbers) {
            handleChange(day, field, "")
            return
        }

        let h = "00"
        let m = "00"

        if (numbers.length === 1) {
            h = `0${numbers}`
        } else if (numbers.length === 2) {
            h = numbers
        } else if (numbers.length === 3) {
            h = `0${numbers[0]}`
            m = numbers.slice(1)
        } else if (numbers.length >= 4) {
            h = numbers.slice(0, 2)
            m = numbers.slice(2, 4)
        }

        let numH = parseInt(h, 10)
        let numM = parseInt(m, 10)

        if (numH > 23) numH = 23
        if (numM > 59) numM = 59

        const formatted = `${numH.toString().padStart(2, "0")}:${numM.toString().padStart(2, "0")}`
        handleChange(day, field, formatted)
    }

    return (
        <div className="space-y-4">
            {SORTED_DAYS.map((day) => {
                const dayConfig = value[day] || { open: false, start: "09:00", end: "18:00" }

                return (
                    <div key={day} className="flex flex-col sm:flex-col gap-4 bg-[var(--bg-input)]/50 p-3 rounded-lg border border-[var(--border-color)]">
                        <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-3 w-40">
                                <Switch
                                    checked={dayConfig.open}
                                    onCheckedChange={(checked) => handleChange(day, 'open', checked)}
                                    className="data-[state=checked]:bg-[var(--accent-primary)] data-[state=unchecked]:bg-[var(--bg-card)] border border-[var(--border-color)]"
                                />
                                <span className={`font-medium text-sm ${dayConfig.open ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}>
                                    {DAYS_TRANSLATION[day]}
                                </span>
                            </div>

                            {!dayConfig.open && (
                                <div className="text-sm text-[var(--text-secondary)] italic flex items-center h-9">
                                    Fechado
                                </div>
                            )}
                        </div>

                        {dayConfig.open && (
                            <div className="space-y-3 pl-12 border-l border-[var(--border-color)]">
                                {/* Horário de Funcionamento */}
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-[var(--text-secondary)] w-16">Expediente:</span>
                                    <div className="relative w-20">
                                        <Input
                                            placeholder="09:00"
                                            maxLength={5}
                                            className="bg-[var(--bg-page)]/50 border-[var(--border-color)] text-[var(--text-primary)] text-center h-9 text-sm focus-visible:ring-[var(--accent-primary)]"
                                            value={dayConfig.start}
                                            onChange={(e) => handleTimeChange(day, 'start', e.target.value)}
                                            onBlur={(e) => handleTimeBlur(day, 'start', e.target.value)}
                                        />
                                    </div>
                                    <span className="text-[var(--text-muted)] text-xs">até</span>
                                    <div className="relative w-20">
                                        <Input
                                            placeholder="18:00"
                                            maxLength={5}
                                            className="bg-[var(--bg-page)]/50 border-[var(--border-color)] text-[var(--text-primary)] text-center h-9 text-sm focus-visible:ring-[var(--accent-primary)]"
                                            value={dayConfig.end}
                                            onChange={(e) => handleTimeChange(day, 'end', e.target.value)}
                                            onBlur={(e) => handleTimeBlur(day, 'end', e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* Horário de Almoço */}
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-2 w-16">
                                        <input
                                            type="checkbox"
                                            checked={!!dayConfig.lunchStart}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    const updated = {
                                                        ...value,
                                                        [day]: {
                                                            ...dayConfig,
                                                            lunchStart: "12:00",
                                                            lunchEnd: "13:00"
                                                        }
                                                    }
                                                    onChange(updated)
                                                } else {
                                                    const updated = {
                                                        ...value,
                                                        [day]: {
                                                            ...dayConfig,
                                                            lunchStart: null,
                                                            lunchEnd: null
                                                        }
                                                    }
                                                    onChange(updated)
                                                }
                                            }}
                                            className="rounded border-[var(--border-color)] bg-[var(--bg-page)] text-[var(--accent-primary)] focus:ring-[var(--accent-primary)]"
                                        />
                                        <span className="text-xs text-[var(--text-secondary)]">Almoço:</span>
                                    </div>

                                    {dayConfig.lunchStart ? (
                                        <>
                                            <div className="relative w-20">
                                                <Input
                                                    placeholder="12:00"
                                                    maxLength={5}
                                                    className="bg-[var(--bg-page)]/50 border-[var(--border-color)] text-center h-9 text-sm text-[var(--text-primary)] focus-visible:ring-[var(--accent-primary)]"
                                                    value={dayConfig.lunchStart || ''}
                                                    onChange={(e) => handleTimeChange(day, 'lunchStart', e.target.value)}
                                                    onBlur={(e) => handleTimeBlur(day, 'lunchStart', e.target.value)}
                                                />
                                            </div>
                                            <span className="text-[var(--text-muted)] text-xs">até</span>
                                            <div className="relative w-20">
                                                <Input
                                                    placeholder="13:00"
                                                    maxLength={5}
                                                    className="bg-[var(--bg-page)]/50 border-[var(--border-color)] text-center h-9 text-sm text-[var(--text-primary)] focus-visible:ring-[var(--accent-primary)]"
                                                    value={dayConfig.lunchEnd || ''}
                                                    onChange={(e) => handleTimeChange(day, 'lunchEnd', e.target.value)}
                                                    onBlur={(e) => handleTimeBlur(day, 'lunchEnd', e.target.value)}
                                                />
                                            </div>
                                        </>
                                    ) : (
                                        <span className="text-xs text-[var(--text-secondary)] italic">Sem pausa</span>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )
            })}
        </div>
    )
}
