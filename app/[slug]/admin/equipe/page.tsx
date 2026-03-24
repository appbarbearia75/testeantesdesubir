"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Pencil, Trash2, Clock, X, Loader2, Users } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { ImageUpload } from "@/components/ui/image-upload"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { InviteCollaboratorForm } from "@/components/admin/InviteCollaboratorForm"

export default function EquipePage() {
    const params = useParams()
    const slug = params.slug as string
    const [barbershopId, setBarbershopId] = useState<string | null>(null)

    useEffect(() => {
        const fetchBarbershopId = async () => {
            const { data } = await supabase
                .from('barbershops')
                .select('id')
                .eq('slug', slug)
                .single()
            if (data) setBarbershopId(data.id)
        }
        if (slug) fetchBarbershopId()
    }, [slug])

    return (
        <div className="space-y-8 max-w-[1200px] mx-auto pb-24 px-4 sm:px-6 lg:px-8">
            <div className="mb-10">
                <h1 className="text-[32px] md:text-4xl font-bold tracking-tight">Equipe</h1>
                <p className="text-zinc-400 mt-2 text-[13px] md:text-sm">
                    Gerencie os profissionais e convites da barbearia.
                </p>
            </div>

            <Tabs defaultValue="colaboradores" className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-[400px] bg-[var(--bg-card)] border border-[var(--border-color)]">
                    <TabsTrigger 
                        value="colaboradores"
                        className="data-[state=active]:bg-[var(--accent-primary)] data-[state=active]:text-black text-[var(--text-secondary)] font-medium"
                    >
                        Colaboradores
                    </TabsTrigger>
                    <TabsTrigger 
                        value="convites"
                        className="data-[state=active]:bg-[var(--accent-primary)] data-[state=active]:text-black text-[var(--text-secondary)] font-medium"
                    >
                        Convites
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="colaboradores" className="mt-8">
                    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] shadow-xl rounded-xl p-6">
                        <TeamManager slug={slug} />
                    </div>
                </TabsContent>

                <TabsContent value="convites" className="mt-8">
                    {barbershopId ? (
                        <InviteCollaboratorForm barbershopId={barbershopId} />
                    ) : (
                        <div className="text-center py-12 text-zinc-500">Carregando...</div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    )
}

function TeamManager({ slug }: { slug: string }) {
    const [barbers, setBarbers] = useState<any[]>([])
    const [name, setName] = useState("")
    const [photoUrl, setPhotoUrl] = useState("")
    const [role, setRole] = useState("Funcionario")
    const [workStart, setWorkStart] = useState("")
    const [workEnd, setWorkEnd] = useState("")
    const [lunchStart, setLunchStart] = useState("")
    const [lunchEnd, setLunchEnd] = useState("")
    const [hasLunchBreak, setHasLunchBreak] = useState(false)
    const [workingHours, setWorkingHours] = useState<any>({
        seg: { open: true },
        ter: { open: true },
        qua: { open: true },
        qui: { open: true },
        sex: { open: true },
        sab: { open: true },
        dom: { open: false }
    })
    const [isDraggingDays, setIsDraggingDays] = useState(false)
    const [dragAction, setDragAction] = useState<boolean | null>(null)
    const [loading, setLoading] = useState(false)
    const [modalOpen, setModalOpen] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)

    useEffect(() => {
        fetchBarbers()
    }, [slug])

    const fetchBarbers = async () => {
        const { data: barbershop } = await supabase.from('barbershops').select('id').eq('slug', slug).single()
        if (barbershop) {
            const { data } = await supabase.from('barbers').select('*').eq('barbershop_id', barbershop.id).eq('active', true)
            setBarbers(data || [])
        }
    }

    const handleSaveBarber = async () => {
        if (!name) return
        setLoading(true)
        try {
            const { data: barbershop } = await supabase.from('barbershops').select('id').eq('slug', slug).single()
            if (!barbershop) return

            const payload = {
                name,
                photo_url: photoUrl,
                role,
                work_start: workStart || null,
                work_end: workEnd || null,
                lunch_start: lunchStart || null,
                lunch_end: lunchEnd || null,
                working_hours: workingHours
            }

            if (editingId) {
                const { error } = await supabase.from('barbers').update(payload).eq('id', editingId)
                if (error) throw error
            } else {
                const { error } = await supabase.from('barbers').insert({
                    ...payload,
                    barbershop_id: barbershop.id
                })
                if (error) throw error
            }

            resetForm()
            setModalOpen(false)
            fetchBarbers()
        } catch (error) {
            console.error("Error saving barber:", error)
        } finally {
            setLoading(false)
        }
    }

    const resetForm = () => {
        setName("")
        setPhotoUrl("")
        setRole("Funcionario")
        setWorkStart("")
        setWorkEnd("")
        setLunchStart("")
        setLunchEnd("")
        setHasLunchBreak(false)
        setWorkingHours({
            seg: { open: true },
            ter: { open: true },
            qua: { open: true },
            qui: { open: true },
            sex: { open: true },
            sab: { open: true },
            dom: { open: false }
        })
        setEditingId(null)
    }

    const openEditModal = (barber: any) => {
        setName(barber.name || "")
        setPhotoUrl(barber.photo_url || "")
        setRole(barber.role || "Funcionario")
        setWorkStart(barber.work_start || "")
        setWorkEnd(barber.work_end || "")
        setLunchStart(barber.lunch_start || "")
        setLunchEnd(barber.lunch_end || "")
        setHasLunchBreak(!!barber.lunch_start || !!barber.lunch_end)
        setWorkingHours(barber.working_hours || {
            seg: { open: true },
            ter: { open: true },
            qua: { open: true },
            qui: { open: true },
            sex: { open: true },
            sab: { open: true },
            dom: { open: false }
        })
        setEditingId(barber.id)
        setModalOpen(true)
    }

    const handleRemoveBarber = async (id: string) => {
        try {
            // Soft delete
            await supabase.from('barbers').update({ active: false }).eq('id', id)
            fetchBarbers()
        } catch (error) {
            console.error("Error removing barber:", error)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h4 className="font-medium text-sm text-[var(--text-secondary)]">Equipe Atual</h4>
                    <p className="text-sm text-[var(--text-muted)] mt-1">Gerencie os profissionais que atuam nesta unidade.</p>
                </div>
                <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                    <DialogTrigger asChild>
                        <Button
                            className="bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/80 text-black font-bold h-10 px-4"
                            onClick={() => {
                                resetForm()
                            }}
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Novo Profissional
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-primary)] max-w-[520px] p-0 flex flex-col gap-0 overflow-hidden">
                        <DialogHeader className="p-6 pb-4 border-b border-[var(--border-color)]">
                            <DialogTitle className="text-xl font-bold text-[var(--text-primary)]">{editingId ? "Editar Profissional" : "Adicionar Profissional"}</DialogTitle>
                            <DialogDescription className="text-[var(--text-secondary)] mt-1">
                                {editingId ? "Atualize os detalhes cadastrais do profissional." : "Preencha as informações do novo membro da barbearia."}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="p-6 overflow-y-auto max-h-[70vh] space-y-8">
                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-sm font-bold text-[var(--accent-primary)]">Informações do profissional</h3>
                                    <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Preencha os dados básicos do membro da equipe.</p>
                                </div>

                                <div className="flex flex-col gap-6">
                                    <div className="flex-1 space-y-4 w-full">
                                        <div className="space-y-2">
                                            <Label className="text-[var(--text-secondary)] text-xs">Nome Completo <span className="text-[var(--accent-primary)]">*</span></Label>
                                            <Input
                                                placeholder="João Silva"
                                                value={name}
                                                onChange={e => setName(e.target.value)}
                                                className="bg-[var(--bg-input)] border-[var(--border-color)] h-11 text-base focus-visible:ring-[var(--accent-primary)] transition-all text-[var(--text-primary)]"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[var(--text-secondary)] text-xs">Cargo / Função <span className="text-[var(--accent-primary)]">*</span></Label>
                                            <Select value={role} onValueChange={setRole}>
                                                <SelectTrigger className="w-full bg-[var(--bg-input)] border-[var(--border-color)] focus:ring-[var(--accent-primary)] transition-colors h-11 text-[var(--text-primary)]">
                                                    <SelectValue placeholder="Selecione o cargo" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-primary)]">
                                                    <SelectItem value="Dono">Dono</SelectItem>
                                                    <SelectItem value="Funcionario">Funcionário</SelectItem>
                                                    <SelectItem value="Recepcionista">Recepcionista</SelectItem>
                                                    <SelectItem value="Freelancer">Freelancer</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="space-y-2 flex flex-col items-start w-full">
                                        <Label className="text-[var(--text-secondary)] text-xs">Foto de Perfil</Label>
                                        <div className="border bg-[var(--bg-input)] hover:bg-[var(--bg-page)] border-[var(--border-color)] transition-colors rounded-xl overflow-hidden flex flex-col justify-center items-center h-28 w-28 relative group shadow-sm">
                                            <ImageUpload
                                                bucket="images"
                                                onUpload={setPhotoUrl}
                                                currentUrl={photoUrl}
                                                label=""
                                                aspectRatio="square"
                                                className="w-full h-full border-0 rounded-none absolute inset-0 z-10"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-sm font-bold text-[var(--accent-primary)]">Horário de trabalho</h3>
                                    <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Defina os turnos específicos apenas para este profissional.</p>
                                </div>

                                <div className="space-y-3 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl p-5">
                                    <div className="flex items-center gap-3 w-full">
                                        <div className="flex items-center gap-3 w-full flex-col sm:flex-row">
                                            <div className="flex items-center gap-2 w-full">
                                                <Input
                                                    type="time"
                                                    value={workStart}
                                                    onChange={e => setWorkStart(e.target.value)}
                                                    className="bg-[var(--bg-page)] border-[var(--border-color)] h-11 text-sm text-center font-mono w-full text-[var(--text-primary)]"
                                                />
                                                <span className="text-[var(--text-muted)] text-sm font-medium">—</span>
                                                <Input
                                                    type="time"
                                                    value={workEnd}
                                                    onChange={e => setWorkEnd(e.target.value)}
                                                    className="bg-[var(--bg-page)] border-[var(--border-color)] h-11 text-sm text-center font-mono w-full text-[var(--text-primary)]"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {!hasLunchBreak ? (
                                        <div className="pt-2">
                                            <Button
                                                variant="ghost"
                                                onClick={() => setHasLunchBreak(true)}
                                                className="h-8 px-3 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 transition-colors w-full sm:w-auto"
                                            >
                                                <Plus className="w-3.5 h-3.5 mr-1.5" />
                                                Adicionar pausa
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="pt-4 mt-4 border-t border-[var(--border-color)] space-y-3 relative group">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs font-medium text-[var(--text-secondary)]">Pausa almoço</span>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => {
                                                        setHasLunchBreak(false)
                                                        setLunchStart("")
                                                        setLunchEnd("")
                                                    }}
                                                    className="h-6 w-6 text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                </Button>
                                            </div>
                                            <div className="flex items-center gap-2 w-full">
                                                <Input
                                                    type="time"
                                                    value={lunchStart}
                                                    onChange={e => setLunchStart(e.target.value)}
                                                    className="bg-[var(--bg-page)]/50 border-transparent focus-visible:border-[var(--border-color)] h-10 text-sm text-center font-mono text-[var(--text-secondary)] w-full"
                                                />
                                                <span className="text-[var(--text-muted)] text-sm font-medium">—</span>
                                                <Input
                                                    type="time"
                                                    value={lunchEnd}
                                                    onChange={e => setLunchEnd(e.target.value)}
                                                    className="bg-[var(--bg-page)]/50 border-transparent focus-visible:border-[var(--border-color)] h-10 text-sm text-center font-mono text-[var(--text-secondary)] w-full"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-sm font-bold text-[var(--accent-primary)]">Dias de trabalho</h3>
                                    <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Selecione os dias da semana em que o membro estará disponível.</p>
                                </div>

                                <div className="bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl p-5 space-y-5">
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Ações rápidas</Label>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                type="button"
                                                onClick={() => {
                                                    const newHours = { ...workingHours };
                                                    Object.keys(newHours).forEach(k => newHours[k].open = true);
                                                    setWorkingHours(newHours);
                                                }}
                                                className="h-7 px-2.5 rounded-md text-[11px] font-medium bg-transparent border-[var(--border-color)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                                            >
                                                Todos
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                type="button"
                                                onClick={() => {
                                                    const newHours = { ...workingHours };
                                                    ['seg', 'ter', 'qua', 'qui', 'sex'].forEach(k => newHours[k].open = true);
                                                    ['sab', 'dom'].forEach(k => newHours[k].open = false);
                                                    setWorkingHours(newHours);
                                                }}
                                                className="h-7 px-2.5 rounded-md text-[11px] font-medium bg-transparent border-[var(--border-color)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                                            >
                                                Seg-Sex
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                type="button"
                                                onClick={() => {
                                                    const newHours = { ...workingHours };
                                                    ['sab', 'dom'].forEach(k => newHours[k].open = true);
                                                    ['seg', 'ter', 'qua', 'qui', 'sex'].forEach(k => newHours[k].open = false);
                                                    setWorkingHours(newHours);
                                                }}
                                                className="h-7 px-2.5 rounded-md text-[11px] font-medium bg-transparent border-[var(--border-color)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                                            >
                                                Fim de Semana
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                type="button"
                                                onClick={() => {
                                                    const newHours = { ...workingHours };
                                                    Object.keys(newHours).forEach(k => newHours[k].open = false);
                                                    setWorkingHours(newHours);
                                                }}
                                                className="h-7 px-2.5 rounded-md text-[11px] font-medium bg-transparent border-red-500/20 hover:bg-red-500/10 text-red-400 hover:text-red-300 transition-colors sm:ml-auto"
                                            >
                                                Limpar
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="w-full h-[1px] bg-[var(--border-color)]" />

                                    <div
                                        className="space-y-3"
                                        onMouseLeave={() => { setIsDraggingDays(false); setDragAction(null); }}
                                        onMouseUp={() => { setIsDraggingDays(false); setDragAction(null); }}
                                    >
                                        <div className="flex items-center justify-between">
                                            <Label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                                                Seleção de dias
                                            </Label>
                                            <span className="text-[10px] font-medium text-[var(--text-muted)] hidden sm:inline-block">Arraste para selecionar vários</span>
                                        </div>
                                        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                                            {['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'].map(day => (
                                                <button
                                                    key={day}
                                                    type="button"
                                                    onMouseDown={() => {
                                                        const newValue = !workingHours[day]?.open;
                                                        setIsDraggingDays(true);
                                                        setDragAction(newValue);
                                                        setWorkingHours((prev: any) => ({ ...prev, [day]: { ...prev[day], open: newValue } }));
                                                    }}
                                                    onMouseEnter={() => {
                                                        if (isDraggingDays && dragAction !== null) {
                                                            setWorkingHours((prev: any) => ({ ...prev, [day]: { ...prev[day], open: dragAction } }));
                                                        }
                                                    }}
                                                    className={`h-10 rounded-md text-[11px] font-bold uppercase transition-all duration-200 border w-full text-center select-none outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent-primary)] ${workingHours[day]?.open
                                                        ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border-[var(--accent-primary)]/30 hover:bg-[var(--accent-primary)]/15 hover:border-[var(--accent-primary)]/50'
                                                        : 'bg-[var(--bg-page)]/40 text-[var(--text-secondary)] border-[var(--border-color)] hover:bg-[var(--hover-bg)] hover:border-[var(--border-color)]/80'
                                                        }`}
                                                    style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
                                                >
                                                    {day}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-[var(--border-color)] flex flex-col-reverse sm:flex-row justify-end gap-3 bg-[var(--bg-card)]">
                            <Button
                                variant="ghost"
                                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)] h-11 w-full sm:w-auto transition-colors"
                                onClick={() => {
                                    setModalOpen(false)
                                    resetForm()
                                }}
                            >
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleSaveBarber}
                                disabled={loading || !name || !role}
                                className="bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/80 text-black font-bold h-11 w-full sm:w-auto shadow-lg shadow-[var(--accent-primary)]/20 transition-all hover:scale-[1.02]"
                            >
                                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                {loading ? "Processando..." : (editingId ? "Salvar Alterações" : "Adicionar profissional")}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="space-y-2">
                {barbers.length === 0 ? (
                    <p className="text-sm text-zinc-500 italic">Nenhum barbeiro cadastrado.</p>
                ) : (
                    <div className="grid gap-2">
                        {barbers.map(barber => (
                            <div key={barber.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-[var(--bg-input)] hover:bg-[var(--bg-card)] transition-colors rounded-xl border border-[var(--border-color)] gap-4 shadow-sm group">
                                <div className="flex items-center gap-4 w-full sm:w-auto">
                                    <div className="w-12 h-12 rounded-full bg-[var(--bg-page)] overflow-hidden shrink-0 border border-[var(--border-color)] shadow-inner">
                                        {barber.photo_url ? (
                                            <img src={barber.photo_url} alt={barber.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)] text-xs font-medium bg-[var(--bg-page)]">
                                                {barber.name.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-[var(--text-primary)] text-base">{barber.name}</span>
                                            {barber.role === 'Dono' && (
                                                <span className="text-[9px] px-1.5 py-0.5 rounded-sm bg-yellow-500/10 text-[#DBC278] uppercase font-black tracking-wider border border-yellow-500/20">Dono</span>
                                            )}
                                        </div>
                                        <div className="flex flex-col mt-0.5 gap-1 text-xs text-[var(--text-secondary)]">
                                            <span>
                                                {barber.role === 'Recepcionista' || barber.role === 'Freelancer' ? barber.role : (barber.role !== 'Dono' && 'Funcionário')}
                                            </span>
                                            {(barber.work_start && barber.work_end) && (
                                                <div className="flex items-center gap-1.5 text-[var(--text-muted)] font-medium">
                                                    <Clock className="w-3 h-3" />
                                                    <span>{barber.work_start.substring(0, 5)} — {barber.work_end.substring(0, 5)}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-0 border-[var(--border-color)] justify-end">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 px-3 text-xs font-medium border-[var(--border-color)] bg-transparent hover:bg-[var(--hover-bg)] text-[var(--text-primary)] transition-colors flex-1 sm:flex-none"
                                        onClick={() => openEditModal(barber)}
                                    >
                                        <Pencil className="w-3.5 h-3.5 mr-1.5" />
                                        Editar
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 px-3 text-xs font-medium border-red-900/30 bg-red-950/20 hover:bg-red-900/40 text-red-400 hover:text-red-300 transition-colors flex-1 sm:flex-none"
                                        onClick={() => handleRemoveBarber(barber.id)}
                                    >
                                        <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                                        Excluir
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
