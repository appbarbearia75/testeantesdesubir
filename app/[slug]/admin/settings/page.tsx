"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Save, AlertCircle, MapPin, Star, Image as ImageIcon, Info, Users, Clock, Lock, ChevronRight, ArrowLeft, Plus, Pencil, MessageCircle, X, Calendar, Search, Loader2, Trash2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { ImageUpload } from "@/components/ui/image-upload"
import { WorkingHoursEditor } from "@/components/admin/WorkingHoursEditor"
import { PasswordChangeForm } from "@/components/admin/PasswordChangeForm"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

function WhatsAppSettingsManager({ numbers, onChange }: { numbers: string[], onChange: (numbers: string[]) => void }) {
    const [newNumber, setNewNumber] = useState("")

    const handleAdd = () => {
        const cleanNumber = newNumber.replace(/\D/g, '')
        if (cleanNumber.length < 10) {
            alert("Digite um número de telefone válido com DDD.")
            return
        }
        if (!numbers.includes(cleanNumber)) {
            onChange([...numbers, cleanNumber])
        }
        setNewNumber("")
    }

    const handleRemove = (numberToRemove: string) => {
        onChange(numbers.filter(n => n !== numberToRemove))
    }

    return (
        <Card className="bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-primary)] shadow-xl">
            <CardHeader>
                <CardTitle>WhatsApp de Notificações</CardTitle>
                <CardDescription className="text-[var(--text-secondary)]">
                    Estes números receberão uma notificação automática via Z-API sempre que um novo agendamento for realizado no sistema. <br />
                    Sugerimos adicionar o número pessoal da gerência e da recepção. (Somente números do Brasil).
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center gap-3">
                    <Input
                        value={newNumber}
                        onChange={(e) => {
                            let v = e.target.value.replace(/\D/g, '')
                            if (v.length > 2) v = v.replace(/^(\d{2})(\d)/, '($1) $2')
                            if (v.length > 7) v = v.replace(/(\d{5})(\d)/, '$1-$2')
                            setNewNumber(v.substring(0, 15))
                        }}
                        placeholder="(11) 99999-9999"
                        className="bg-[var(--bg-input)] border-[var(--border-color)] max-w-sm text-[var(--text-primary)] focus-visible:ring-[var(--accent-primary)]"
                        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                    />
                    <Button
                        type="button"
                        onClick={handleAdd}
                        disabled={!newNumber || newNumber.replace(/\D/g, '').length < 10}
                        className="bg-[#25D366] hover:bg-[#1DA851] text-white"
                    >
                        <Plus className="w-5 h-5 mr-1" /> Adicionar
                    </Button>
                </div>

                {numbers.length > 0 ? (
                    <div className="bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl p-4 flex flex-wrap gap-2">
                        {numbers.map(num => {
                            const formatted = num.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3')
                            return (
                                <div key={num} className="flex items-center gap-2 bg-[#25D366]/10 border border-[#25D366]/30 text-[#25D366] px-3 py-1.5 rounded-full text-sm font-medium">
                                    {formatted}
                                    <button
                                        onClick={() => handleRemove(num)}
                                        className="hover:text-red-400 p-0.5 rounded-full hover:bg-[#25D366]/20 transition-colors"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            )
                        })}
                    </div>
                ) : (
                    <div className="bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl p-6 flex flex-col items-center justify-center text-center text-[var(--text-secondary)]">
                        <MessageCircle className="w-8 h-8 mb-2 opacity-50" />
                        <p className="text-sm">Nenhum número de notificação configurado.</p>
                        <p className="text-xs mt-1 text-[var(--text-muted)]">Neste caso, a notificação irá para o número público da barbearia ({'{'}client.phone{'}'}).</p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

export default function SettingsPage() {
    const params = useParams()
    const slug = params.slug as string
    const [searchTerm, setSearchTerm] = useState("")
    const [activeSection, setActiveSection] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        address: "",
        google_maps_link: "",
        google_reviews_link: "",
        avatar_url: "",
        cover_url: "",
        vip_plan_title: "",
        vip_plan_price: "",
        vip_plan_price_from: "",
        opening_hours: {
            seg: { open: false, start: "09:00", end: "19:00" },
            ter: { open: true, start: "09:00", end: "19:00" },
            qua: { open: true, start: "09:00", end: "19:00" },
            qui: { open: true, start: "09:00", end: "19:00" },
            sex: { open: true, start: "09:00", end: "19:00" },
            sab: { open: true, start: "09:00", end: "18:00" },
            dom: { open: false, start: "09:00", end: "13:00" },
        },
        whatsapp_notification_numbers: [] as string[],
        auto_complete_bookings: true
    })
    const [msg, setMsg] = useState({ type: "", text: "" })

    useEffect(() => {
        fetchSettings()
    }, [slug])

    const fetchSettings = async () => {
        const { data } = await supabase.from('barbershops').select('*').eq('slug', slug).single()
        if (data) {
            setFormData({
                name: data.name || "",
                phone: data.phone || "",
                address: data.address || "",
                google_maps_link: data.google_maps_link || "",
                google_reviews_link: data.google_reviews_link || "",
                avatar_url: data.avatar_url || "",
                cover_url: data.cover_url || "",
                vip_plan_title: data.vip_plan_title || "VIP",
                vip_plan_price: data.vip_plan_price || "R$ 0,00",
                vip_plan_price_from: data.vip_plan_price_from || "",
                opening_hours: data.opening_hours || formData.opening_hours,
                whatsapp_notification_numbers: data.whatsapp_notification_numbers || [],
                auto_complete_bookings: data.auto_complete_bookings !== false
            })

        }
    }

    const handleUpload = (field: 'avatar_url' | 'cover_url', url: string) => {
        const oldUrl = formData[field]
        if (oldUrl && oldUrl !== url) {
            deleteImageFromStorage(oldUrl)
        }
        setFormData(prev => ({ ...prev, [field]: url }))
    }

    const deleteImageFromStorage = async (url: string) => {
        try {
            if (!url.includes('/storage/v1/object/public/')) return
            const bucketName = 'images'
            if (url.includes(`/${bucketName}/`)) {
                const relativePath = url.split(`/${bucketName}/`)[1]
                await supabase.storage.from(bucketName).remove([relativePath])
            }
        } catch (error) {
            console.error("Error deleting old image:", error)
        }
    }

    const handleSave = async () => {
        setLoading(true)
        setMsg({ type: "", text: "" })

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { error } = await supabase
                .from('barbershops')
                .update({
                    name: formData.name,
                    phone: formData.phone,
                    address: formData.address,
                    google_maps_link: formData.google_maps_link,
                    google_reviews_link: formData.google_reviews_link,
                    avatar_url: formData.avatar_url,
                    cover_url: formData.cover_url,
                    vip_plan_title: formData.vip_plan_title,
                    vip_plan_price: formData.vip_plan_price,
                    vip_plan_price_from: formData.vip_plan_price_from,
                    opening_hours: formData.opening_hours,
                    whatsapp_notification_numbers: formData.whatsapp_notification_numbers,
                    auto_complete_bookings: formData.auto_complete_bookings
                })
                .eq('id', user.id)

            if (error) throw error

            if (formData.auto_complete_bookings) {
                // Fetch whether the user has PDV enabled to respect rules
                const { data: globalShop } = await supabase.from('barbershops').select('pdv_enabled').eq('id', user.id).single()

                // Só processa autoComplete se for SEM PDV
                if (globalShop && globalShop.pdv_enabled === false) {
                    const now = new Date()
                    const todayStr = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().split('T')[0]

                    const { data: pending } = await supabase
                        .from('bookings')
                        .select(`*, services(title, duration, price), barbers(commission_type, commission_value)`)
                        .eq('barbershop_id', user.id)
                        .eq('status', 'confirmed')
                        .lte('date', todayStr)

                    if (pending && pending.length > 0) {
                        for (const b of pending) {
                            let shouldComplete = false;
                            const [year, month, day] = b.date.split('-').map(Number);
                            const [hour, min] = b.time.split(':').map(Number);
                            const bDate = new Date(year, month - 1, day, hour, min);

                            let durationMins = 30;
                            const durationStr = (b.services as any)?.duration?.toString() || '30';
                            if (durationStr.includes(':')) {
                                const [dh, dm] = durationStr.split(':').map(Number);
                                durationMins = (dh * 60) + (dm || 0);
                            } else if (durationStr.toLowerCase().includes('h')) {
                                const hMatch = durationStr.match(/(\d+)\s*h/i);
                                const mMatch = durationStr.match(/(\d+)\s*m/i);
                                const dh = hMatch ? parseInt(hMatch[1]) : 0;
                                const dm = mMatch ? parseInt(mMatch[1]) : 0;
                                durationMins = (dh * 60) + dm;
                                if (durationMins === 0) durationMins = parseInt(durationStr.replace(/\D/g, '')) || 30;
                            } else {
                                durationMins = parseInt(durationStr.replace(/\D/g, '')) || 30;
                            }
                            bDate.setMinutes(bDate.getMinutes() + durationMins)

                            if (now >= bDate) {
                                shouldComplete = true
                            }

                            if (shouldComplete) {
                                let commission_earned = 0
                                const bPrice = parseFloat((b.services as any)?.price || '0')
                                
                                if (b.barbers) {
                                    const cType = (b.barbers as any).commission_type || 'percentage'
                                    const cValue = parseFloat((b.barbers as any).commission_value) || 0
                                    if (cType === 'percentage') {
                                        commission_earned = bPrice * (cValue / 100)
                                    } else if (cType === 'fixed') {
                                        commission_earned = cValue
                                    }
                                }
                                
                                const updateData: any = { status: 'completed', commission_earned }
                                
                                // Criação do comando (faturamento) para refletir nos gráficos
                                if (!b.command_id && bPrice > 0) {
                                    const { data: cmd } = await supabase.from('commands').insert([{
                                        barbershop_id: user.id,
                                        client_name: b.customer_name || 'Cliente (Auto)',
                                        status: 'closed',
                                        subtotal_amount: bPrice,
                                        discount_amount: 0,
                                        discount_type: 'fixed',
                                        total_amount: bPrice,
                                        payment_method: 'PIX'
                                    }]).select('id').single()

                                    if (cmd) {
                                        await supabase.from('command_items').insert([{
                                            command_id: cmd.id,
                                            item_type: 'service',
                                            item_id: b.service_id,
                                            item_name: (b.services as any)?.title || 'Serviço Auto',
                                            unit_price: bPrice,
                                            quantity: 1,
                                            total_price: bPrice,
                                            barber_id: b.barber_id || null
                                        }])
                                        updateData.command_id = cmd.id
                                    }
                                }
                                
                                await supabase.from('bookings').update(updateData).eq('id', b.id)
                            }
                        }
                    }
                }
            }

            setMsg({ type: "success", text: "Configurações salvas com sucesso!" })
        } catch (error) {
            console.error("Error saving settings:", error)
            setMsg({ type: "error", text: "Erro ao salvar alterações." })
        } finally {
            setLoading(false)
        }
    }

    const sectionsList = [
        {
            id: 'images',
            title: 'Imagens',
            description: 'Gerencie logo e imagens da página de agendamento.',
            icon: <div className="p-2.5 bg-blue-500/10 text-blue-500 rounded-[10px]"><ImageIcon className="w-5 h-5" /></div>,
            category: 'NEGÓCIO',
            status: formData.avatar_url ? 'Imagens configuradas' : 'Sem imagens'
        },
        {
            id: 'general',
            title: 'Informações Gerais',
            description: 'Configure nome da barbearia, endereço e dados visíveis aos clientes.',
            icon: <div className="p-2.5 bg-purple-500/10 text-purple-500 rounded-[10px]"><Info className="w-5 h-5" /></div>,
            category: 'NEGÓCIO',
            status: formData.name ? 'Preenchido' : 'Não configurado'
        },
        {
            id: 'hours',
            title: 'Horários de Atendimento',
            description: 'Defina os dias e horários que a barbearia funciona.',
            icon: <div className="p-2.5 bg-[#DBC278]/10 text-[#DBC278] rounded-[10px]"><Clock className="w-5 h-5" /></div>,
            category: 'NEGÓCIO',
            status: 'Horário configurado'
        },
        {
            id: 'agenda',
            title: 'Configurações da Agenda',
            description: 'Defina a duração padrão de serviços, intervalos e regras de agendamento automáticos.',
            icon: <div className="p-2.5 bg-orange-500/10 text-orange-500 rounded-[10px]"><Calendar className="w-5 h-5" /></div>,
            category: 'AGENDA',
            status: formData.auto_complete_bookings ? 'Auto-completar ON' : 'Auto-completar OFF'
        },

        {
            id: 'whatsapp',
            title: 'Configurar WhatsApp',
            description: 'Gerencie os números que recebem notificações de novos agendamentos.',
            icon: <div className="p-2.5 bg-[#25D366]/10 text-[#25D366] rounded-[10px]"><MessageCircle className="w-5 h-5" /></div>,
            category: 'COMUNICAÇÃO',
            status: formData.whatsapp_notification_numbers.length > 0 ? 'Status: Conectado' : 'Não configurado'
        },
        {
            id: 'security',
            title: 'Segurança',
            description: 'Gerencie credenciais de acesso e segurança.',
            icon: <div className="p-2.5 bg-red-500/10 text-red-500 rounded-[10px]"><Lock className="w-5 h-5" /></div>,
            category: 'SISTEMA',
            status: 'Protegido'
        },
    ]

    const filteredSections = sectionsList.filter(s =>
        s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.category.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const categories = ['NEGÓCIO', 'AGENDA', 'COMUNICAÇÃO', 'SISTEMA']

    return (
        <div className="space-y-8 max-w-[1200px] mx-auto pb-24 px-4 sm:px-6 lg:px-8">
            {!activeSection ? (
                <>
                    <div className="mb-10 text-center">
                        <h1 className="text-[32px] md:text-4xl font-bold tracking-tight">Configurações</h1>
                        <p className="text-[var(--text-secondary)] mt-2 mb-8 text-[13px] md:text-sm">Personalize sua barbearia e gerencie o sistema.</p>

                        <div className="relative max-w-[500px] mx-auto">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                            <Input
                                placeholder="Buscar configuração..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-12 h-12 bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-primary)] rounded-[12px] focus-visible:ring-[var(--accent-primary)] shadow-lg text-sm"
                            />
                        </div>
                    </div>

                    <div className="space-y-8">
                        {categories.map(cat => {
                            const catSections = filteredSections.filter(s => s.category === cat)
                            if (catSections.length === 0) return null

                            return (
                                <div key={cat} className="space-y-4">
                                    <div className="flex items-center gap-3 pl-1 mb-2">
                                        <h2 className="text-sm font-black text-[var(--text-secondary)] uppercase tracking-widest">{cat}</h2>
                                        <div className="flex-1 h-px bg-[var(--border-color)]" />
                                    </div>
                                    <div
                                        className="grid gap-[20px]"
                                        style={{
                                            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))'
                                        }}
                                    >
                                        {catSections.map((sec) => (
                                            <button
                                                key={sec.id}
                                                onClick={() => setActiveSection(sec.id)}
                                                className="group w-full text-left p-[20px] flex items-start gap-4 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[12px] hover:border-[var(--border-color)]/80 transition-all duration-200 hover:-translate-y-[4px] shadow-sm hover:shadow-md"
                                            >
                                                <div className="shrink-0 transition-transform duration-200 group-hover:scale-105">
                                                    {sec.icon}
                                                </div>
                                                <div className="flex-1 min-w-0 flex flex-col pt-0">
                                                    <h3 className="font-bold text-[var(--text-primary)] text-[16px] tracking-tight truncate">{sec.title}</h3>
                                                    <p className="text-[13px] text-[var(--text-secondary)] mt-1 line-clamp-2 leading-relaxed">{sec.description}</p>

                                                    {sec.status && (
                                                        <div className="mt-2 pt-1 border-t border-white/5">
                                                            <span className={`text-[12px] font-medium ${sec.status?.includes('Não') || sec.status?.includes('Sem') ? 'text-red-400' : 'text-green-500'}`}>
                                                                {sec.status}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )
                        })}

                        {filteredSections.length === 0 && (
                            <div className="text-center py-12 text-[var(--text-secondary)] bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)]">
                                <Search className="w-8 h-8 mx-auto mb-3 opacity-20 text-[var(--text-muted)]" />
                                <p>Nenhuma configuração encontrada para "{searchTerm}".</p>
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <>
                    <div className="flex items-center gap-4 mb-6">
                        <Button variant="ghost" size="icon" className="rounded-full w-12 h-12 bg-[var(--bg-card)] border border-[var(--border-color)] hover:bg-[var(--hover-bg)]" onClick={() => setActiveSection(null)}>
                            <ArrowLeft className="w-5 h-5 text-[var(--text-primary)]" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold text-[var(--text-primary)]">{sectionsList.find(s => s.id === activeSection)?.title}</h1>
                            <p className="text-sm text-[var(--text-secondary)]">{sectionsList.find(s => s.id === activeSection)?.description}</p>
                        </div>
                    </div>

                    <div className="animate-in slide-in-from-right-4 fade-in duration-300">
                        {activeSection === 'images' && (
                            <div className="mx-auto w-full max-w-[1000px] animate-in fade-in zoom-in-95 duration-200">
                                <Card className="bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-primary)] shadow-xl overflow-hidden">
                                    <CardContent className="p-6 md:p-8">
                                        <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-start justify-between">
                                            
                                            {/* Profile Section */}
                                            <div className="w-full md:w-[260px] lg:w-[300px] shrink-0 space-y-4">
                                                <div className="space-y-1 text-left">
                                                    <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">Foto de Perfil</h3>
                                                    <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                                                        Formato 1:1 quadrado. Recomendado: 500x500px.
                                                    </p>
                                                </div>
                                                <div className="w-full max-w-[300px] mx-auto md:mx-0">
                                                    <ImageUpload
                                                        label=""
                                                        bucket="images"
                                                        currentUrl={formData.avatar_url}
                                                        onUpload={(url) => setFormData(prev => ({ ...prev, avatar_url: url }))}
                                                        aspectRatio="square"
                                                    />
                                                </div>
                                            </div>

                                            <div className="hidden md:block w-px self-stretch bg-[var(--border-color)] opacity-50" />
                                            <div className="block md:hidden h-px w-full bg-[var(--border-color)] opacity-50" />

                                            {/* Cover Section */}
                                            <div className="w-full flex-1 space-y-4">
                                                <div className="space-y-1 text-left">
                                                    <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">Foto de Capa</h3>
                                                    <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                                                        Formato horizontal 4:1 ou 3:1. Exemplo: 1200x300px.
                                                    </p>
                                                </div>
                                                <div className="w-full">
                                                    <ImageUpload
                                                        label=""
                                                        bucket="images"
                                                        currentUrl={formData.cover_url}
                                                        onUpload={(url) => setFormData(prev => ({ ...prev, cover_url: url }))}
                                                        aspectRatio="video"
                                                    />
                                                </div>
                                            </div>

                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        {activeSection === 'general' && (
                            <Card className="bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-primary)] shadow-xl">
                                <CardContent className="space-y-6 p-6">
                                    <div className="space-y-2">
                                        <Label>Nome da Barbearia</Label>
                                        <Input
                                            value={formData.name}
                                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                            className="bg-[var(--bg-input)] border-[var(--border-color)] focus-visible:ring-[var(--accent-primary)]"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Telefone / WhatsApp</Label>
                                        <Input
                                            value={formData.phone}
                                            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                            className="bg-[var(--bg-input)] border-[var(--border-color)] focus-visible:ring-[var(--accent-primary)]"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Endereço Completo</Label>
                                        <Input
                                            value={formData.address}
                                            onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                                            className="bg-[var(--bg-input)] border-[var(--border-color)] focus-visible:ring-[var(--accent-primary)]"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Link Google Maps</Label>
                                        <div className="relative">
                                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                                            <Input
                                                value={formData.google_maps_link}
                                                onChange={(e) => setFormData(prev => ({ ...prev, google_maps_link: e.target.value }))}
                                                className="pl-9 bg-[var(--bg-input)] border-[var(--border-color)] focus-visible:ring-[var(--accent-primary)]"
                                                placeholder="https://maps.google.com/..."
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Link Avaliações Google</Label>
                                        <div className="relative">
                                            <Star className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                                            <Input
                                                value={formData.google_reviews_link}
                                                onChange={(e) => setFormData(prev => ({ ...prev, google_reviews_link: e.target.value }))}
                                                className="pl-9 bg-[var(--bg-input)] border-[var(--border-color)] focus-visible:ring-[var(--accent-primary)]"
                                                placeholder="https://g.page/r/..."
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {activeSection === 'whatsapp' && (
                            <WhatsAppSettingsManager
                                numbers={formData.whatsapp_notification_numbers}
                                onChange={(newNumbers) => setFormData(prev => ({ ...prev, whatsapp_notification_numbers: newNumbers }))}
                            />
                        )}


                        {activeSection === 'hours' && (
                            <Card className="bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-primary)] shadow-xl">
                                <CardContent className="p-6">
                                    <WorkingHoursEditor
                                        value={formData.opening_hours}
                                        onChange={(newHours) => setFormData(prev => ({ ...prev, opening_hours: newHours as any }))}
                                    />
                                </CardContent>
                            </Card>
                        )}

                        {activeSection === 'security' && (
                            <Card className="bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-primary)] shadow-xl">
                                <CardContent className="p-6">
                                    <PasswordChangeForm />
                                </CardContent>
                            </Card>
                        )}

                        {activeSection === 'agenda' && (
                            <Card className="bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-primary)] shadow-xl">
                                <CardContent className="space-y-6 p-6">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <Label className="text-base text-[var(--text-primary)] font-bold">Encerrar agendamentos automático</Label>
                                                <p className="text-sm text-[var(--text-secondary)]">
                                                    Ao ativar, o sistema finalizará automaticamente os agendamentos assim que o horário de término for atingido (comissão percentual base será registrada sem fluxo de PDV).
                                                </p>
                                            </div>
                                            <Switch
                                                checked={formData.auto_complete_bookings}
                                                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, auto_complete_bookings: checked }))}
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </>
            )}

            {msg.text && (
                <div className={`p-4 rounded-lg text-sm flex items-center gap-2 fixed bottom-8 right-8 z-50 shadow-xl animate-in fade-in slide-in-from-bottom-4 ${msg.type === 'success' ? 'bg-green-900 border border-green-800 text-green-100' : 'bg-red-900 border border-red-800 text-red-100'}`}>
                    <AlertCircle className="w-5 h-5" />
                    {msg.text}
                </div>
            )}

            {activeSection && (
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-[var(--bg-page)]/90 backdrop-blur-md border-t border-[var(--border-color)] flex gap-3 justify-center z-40 lg:ml-64 animate-in slide-in-from-bottom">
                    <Button onClick={() => setActiveSection(null)} variant="outline" className="border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-primary)] hover:bg-[var(--hover-bg)] w-full md:w-auto h-12 md:min-w-[150px]">
                        Voltar
                    </Button>
                    <Button onClick={handleSave} className="bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/80 text-black font-bold w-full md:w-auto h-12 md:min-w-[200px]" disabled={loading}>
                        {loading ? "Salvando..." : (
                            <>
                                <Save className="w-4 h-4 mr-2" />
                                Salvar Alterações
                            </>
                        )}
                    </Button>
                </div>
            )}
        </div>
    )
}
