"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/lib/supabase"
import { format, differenceInDays, isPast, addDays } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Edit, Trash2, Save, X, QrCode, Link, Copy, Check, Download, MapPin, Smartphone, Banknote } from "lucide-react"
import { WorkingHoursEditor } from "@/components/admin/WorkingHoursEditor"
import { QRCodeSVG } from "qrcode.react"
import dynamic from "next/dynamic"

// Import QrCodeModal with SSR disabled to avoid jspdf/html-to-image issues during build
const QrCodeModal = dynamic(() => import("@/components/admin/QrCodeModal"), { ssr: false })
// Logic for jspdf and html-to-image moved to QrCodeModal component

const getDaysRemaining = (endDateStr: string) => {
    if (!endDateStr) return { text: "Sem Vencimento", color: "text-zinc-500", expired: false }
    const endDate = new Date(endDateStr)
    const days = differenceInDays(endDate, new Date())
    const expired = isPast(endDate) && days < 0

    if (expired) {
        return { text: `Venceu há ${Math.abs(days)} dias`, color: "text-red-500", expired: true }
    } else if (days === 0) {
        return { text: "Vence hoje", color: "text-amber-500", expired: false }
    } else if (days <= 5) {
        return { text: `Vence em ${days} dia(s)`, color: "text-amber-500", expired: false }
    } else {
        return { text: `Vence em ${days} dias`, color: "text-green-500", expired: false }
    }
}

export default function BarbershopsPage() {
    const [barbershops, setBarbershops] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [editingShop, setEditingShop] = useState<any>(null)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [formData, setFormData] = useState({
        name: "",
        slug: "",
        phone: "",
        address: "",
        google_maps_link: "",
        google_reviews_link: "",
        vip_plan_title: "",
        vip_plan_price: "",
        opening_hours: {},
        subscription_status: "active",
        subscription_price: "R$ 0,00",
        subscription_end_date: "",
        is_active: true
    })
    const [qrShop, setQrShop] = useState<any>(null)
    const [isQrModalOpen, setIsQrModalOpen] = useState(false)
    const [copiedId, setCopiedId] = useState<string | null>(null)

    useEffect(() => {
        fetchBarbershops()
    }, [])

    const fetchBarbershops = async () => {
        const { data, error } = await supabase
            .from("barbershops")
            .select("*")
            .order("created_at", { ascending: false })

        if (data) setBarbershops(data)
        setLoading(false)
    }

    const toggleStatus = async (id: string, currentStatus: boolean) => {
        // Optimistic update
        setBarbershops(prev => prev.map(b => b.id === id ? { ...b, is_active: !currentStatus } : b))

        const { error } = await supabase
            .from("barbershops")
            .update({ is_active: !currentStatus })
            .eq("id", id)

        if (error) {
            console.error("Error updating status:", error)
            // Revert on error
            fetchBarbershops()
        }
    }

    const handleConfirmPayment = async (shop: any) => {
        if (!confirm(`Confirmar o pagamento de ${shop.name} e prorrogar o vencimento em +30 dias?`)) return

        const currentDate = shop.subscription_end_date ? new Date(shop.subscription_end_date) : addDays(new Date(shop.created_at), 30);

        let newEndDate = new Date()
        if (currentDate > new Date()) {
            newEndDate = addDays(currentDate, 30)
        } else {
            newEndDate = addDays(new Date(), 30)
        }

        // Optimistic update
        setBarbershops(prev => prev.map(b => b.id === shop.id ? {
            ...b,
            subscription_end_date: newEndDate.toISOString(),
            subscription_status: 'active'
        } : b))

        const { error } = await supabase
            .from("barbershops")
            .update({
                subscription_end_date: newEndDate.toISOString(),
                subscription_status: 'active'
            })
            .eq("id", shop.id)

        if (error) {
            console.error("Error confirming payment:", error)
            alert("Erro ao confirmar pagamento.")
            fetchBarbershops()
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Tem certeza que deseja excluir esta barbearia? Esta ação não pode ser desfeita.")) return

        const { error } = await supabase
            .from("barbershops")
            .delete()
            .eq("id", id)

        if (error) {
            console.error("Error deleting barbershop:", error)
            alert("Erro ao excluir barbearia.")
        } else {
            setBarbershops(prev => prev.filter(b => b.id !== id))
        }
    }

    const openEditModal = (shop: any) => {
        setEditingShop(shop)
        setFormData({
            name: shop.name || "",
            slug: shop.slug || "",
            phone: shop.phone || "",
            address: shop.address || "",
            google_maps_link: shop.google_maps_link || "",
            google_reviews_link: shop.google_reviews_link || "",
            vip_plan_title: shop.vip_plan_title || "VIP",
            vip_plan_price: shop.vip_plan_price || "R$ 0,00",
            opening_hours: shop.opening_hours || {
                seg: { open: false, start: "09:00", end: "19:00" },
                ter: { open: true, start: "09:00", end: "19:00" },
                qua: { open: true, start: "09:00", end: "19:00" },
                qui: { open: true, start: "09:00", end: "19:00" },
                sex: { open: true, start: "09:00", end: "19:00" },
                sab: { open: true, start: "09:00", end: "18:00" },
                dom: { open: false, start: "09:00", end: "13:00" },
            },
            subscription_status: shop.subscription_status || "active",
            subscription_price: Number(shop.subscription_price || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
            subscription_end_date: shop.subscription_end_date ? format(new Date(shop.subscription_end_date), "yyyy-MM-dd") : format(addDays(new Date(shop.created_at), 30), "yyyy-MM-dd"),
            is_active: shop.is_active
        })
        setIsEditModalOpen(true)
    }

    const handleSave = async () => {
        if (!editingShop) return

        const { error } = await supabase
            .from("barbershops")
            .update({
                name: formData.name,
                slug: formData.slug,
                phone: formData.phone,
                address: formData.address,
                google_maps_link: formData.google_maps_link,
                google_reviews_link: formData.google_reviews_link,
                vip_plan_title: formData.vip_plan_title,
                vip_plan_price: formData.vip_plan_price,
                opening_hours: formData.opening_hours,
                subscription_status: formData.subscription_status,
                subscription_price: Number(formData.subscription_price.replace(/\D/g, "")) / 100,
                subscription_end_date: formData.subscription_end_date ? new Date(formData.subscription_end_date).toISOString() : null,
                is_active: formData.is_active
            })
            .eq("id", editingShop.id)

        if (error) {
            console.error("Error updating barbershop:", error)
            alert("Erro ao atualizar barbearia.")
        } else {
            setBarbershops(prev => prev.map(b => b.id === editingShop.id ? {
                ...b,
                ...formData,
                subscription_price: Number(formData.subscription_price.replace(/\D/g, "")) / 100,
                subscription_end_date: formData.subscription_end_date ? new Date(formData.subscription_end_date).toISOString() : null
            } : b))
            setIsEditModalOpen(false)
            setEditingShop(null)
        }
    }

    const copyLink = (slug: string, id: string) => {
        const url = `${window.location.origin}/${slug}`
        navigator.clipboard.writeText(url)
        setCopiedId(id)
        setTimeout(() => setCopiedId(null), 2000)
    }

    const openQrModal = (shop: any) => {
        setQrShop(shop)
        setIsQrModalOpen(true)
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Barbearias</h1>
                    <p className="text-neutral-400">Gerencie todas as barbearias cadastradas no sistema.</p>
                </div>
            </div>

            <Card className="bg-[#1c1c1c] border-white/5 text-white shadow-2xl shadow-black/50">
                <CardHeader>
                    <CardTitle>Todas as Barbearias</CardTitle>
                    <CardDescription>Lista completa de clientes da plataforma.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow className="border-white/10 hover:bg-white/5">
                                <TableHead className="text-neutral-400">Barbearia</TableHead>
                                <TableHead className="text-neutral-400">Slug</TableHead>
                                <TableHead className="text-neutral-400">Data Cadastro</TableHead>
                                <TableHead className="text-neutral-400">Assinatura</TableHead>
                                <TableHead className="text-neutral-400">Mensalidade</TableHead>
                                <TableHead className="text-neutral-400">Vencimento</TableHead>
                                <TableHead className="text-neutral-400">Ativo</TableHead>
                                <TableHead className="text-neutral-400 text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8">Carregando...</TableCell>
                                </TableRow>
                            ) : barbershops.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-8 text-neutral-500">Nenhuma barbearia encontrada.</TableCell>
                                </TableRow>
                            ) : (
                                barbershops.map((shop) => (
                                    <TableRow key={shop.id} className="border-white/10 hover:bg-white/5">
                                        <TableCell className="flex items-center gap-3">
                                            <Avatar className="w-8 h-8">
                                                <AvatarImage src={shop.avatar_url} />
                                                <AvatarFallback>{shop.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{shop.name}</span>
                                                <span className="text-xs text-neutral-500">{shop.email}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-mono text-xs">{shop.slug}</TableCell>
                                        <TableCell>{format(new Date(shop.created_at), "dd/MM/yyyy")}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={`
                                                ${shop.subscription_status === 'active' ? 'border-green-500/30 text-green-500 bg-green-500/10' : ''}
                                                ${shop.subscription_status === 'inactive' ? 'border-red-500/30 text-red-500 bg-red-500/10' : ''}
                                                ${shop.subscription_status === 'trial' ? 'border-blue-500/30 text-blue-500 bg-blue-500/10' : ''}
                                            `}>
                                                {shop.subscription_status || "active"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="font-medium text-[#DBC278]">
                                            {Number(shop.subscription_price || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium">
                                                    {shop.subscription_end_date
                                                        ? format(new Date(shop.subscription_end_date), "dd/MM/yyyy")
                                                        : format(addDays(new Date(shop.created_at), 30), "dd/MM/yyyy")}
                                                </span>
                                                <span className={`text-[10px] font-bold uppercase ${getDaysRemaining(shop.subscription_end_date || addDays(new Date(shop.created_at), 30).toISOString()).color}`}>
                                                    {getDaysRemaining(shop.subscription_end_date || addDays(new Date(shop.created_at), 30).toISOString()).text}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Switch
                                                checked={shop.is_active}
                                                onCheckedChange={() => toggleStatus(shop.id, shop.is_active)}
                                                className="data-[state=checked]:bg-[#DBC278] data-[state=unchecked]:bg-zinc-600 border-zinc-500"
                                            />
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 hover:bg-green-500/20 text-zinc-400 hover:text-green-500"
                                                    onClick={() => handleConfirmPayment(shop)}
                                                    title="Confirmar Pagamento (+30 dias)"
                                                >
                                                    <Banknote className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 hover:bg-white/10 text-zinc-400 hover:text-[#DBC278]"
                                                    onClick={() => copyLink(shop.slug, shop.id)}
                                                    title="Copiar Link"
                                                >
                                                    {copiedId === shop.id ? <Check className="w-4 h-4 text-green-500" /> : <Link className="w-4 h-4" />}
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 hover:bg-white/10 text-zinc-400 hover:text-[#DBC278]"
                                                    onClick={() => openQrModal(shop)}
                                                    title="Gerar QR Code"
                                                >
                                                    <QrCode className="w-4 h-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10 text-zinc-400 hover:text-white" onClick={() => openEditModal(shop)}>
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-red-500/20 text-zinc-400 hover:text-red-500" onClick={() => handleDelete(shop.id)}>
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="bg-[#1c1c1c] border-zinc-800 text-white sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Editar Barbearia</DialogTitle>
                        <DialogDescription>
                            Faça alterações nas informações da barbearia.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nome da Barbearia</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="bg-zinc-900 border-zinc-800"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="slug">Slug (URL)</Label>
                            <Input
                                id="slug"
                                value={formData.slug}
                                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                className="bg-zinc-900 border-zinc-800"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Telefone</Label>
                            <Input
                                id="phone"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="bg-zinc-900 border-zinc-800"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="address">Endereço</Label>
                            <Input
                                id="address"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                className="bg-zinc-900 border-zinc-800"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="google_maps_link">Link Google Maps</Label>
                            <Input
                                id="google_maps_link"
                                value={formData.google_maps_link}
                                onChange={(e) => setFormData({ ...formData, google_maps_link: e.target.value })}
                                className="bg-zinc-900 border-zinc-800"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="google_reviews_link">Link Avaliações Google</Label>
                            <Input
                                id="google_reviews_link"
                                value={formData.google_reviews_link}
                                onChange={(e) => setFormData({ ...formData, google_reviews_link: e.target.value })}
                                className="bg-zinc-900 border-zinc-800"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="vip_plan_title">Nome Plano VIP</Label>
                                <Input
                                    id="vip_plan_title"
                                    value={formData.vip_plan_title}
                                    onChange={(e) => setFormData({ ...formData, vip_plan_title: e.target.value })}
                                    className="bg-zinc-900 border-zinc-800"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="vip_plan_price">Preço Plano VIP</Label>
                                <Input
                                    id="vip_plan_price"
                                    value={formData.vip_plan_price}
                                    onChange={(e) => setFormData({ ...formData, vip_plan_price: e.target.value })}
                                    className="bg-zinc-900 border-zinc-800"
                                />
                            </div>
                        </div>
                        <div className="space-y-2 border-t border-zinc-800 pt-4">
                            <Label>Horários de Atendimento</Label>
                            <WorkingHoursEditor
                                value={formData.opening_hours as any}
                                onChange={(newHours) => setFormData({ ...formData, opening_hours: newHours })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="subscription">Plano (Status)</Label>
                                <Select
                                    value={formData.subscription_status}
                                    onValueChange={(value) => setFormData({ ...formData, subscription_status: value })}
                                >
                                    <SelectTrigger className="bg-zinc-900 border-zinc-800">
                                        <SelectValue placeholder="Selecione o plano" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                                        <SelectItem value="active">Ativo</SelectItem>
                                        <SelectItem value="inactive">Inativo</SelectItem>
                                        <SelectItem value="trial">Trial</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="subscription_price">Valor da Mensalidade</Label>
                                <Input
                                    id="subscription_price"
                                    value={formData.subscription_price.replace(/^R\$\s*/i, "").trim()}
                                    placeholder="0,00"
                                    onChange={(e) => {
                                        const numericValue = e.target.value.replace(/\D/g, "");
                                        const amount = Number(numericValue) / 100;
                                        setFormData({
                                            ...formData,
                                            subscription_price: amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                                        });
                                    }}
                                    className="bg-zinc-900 border-zinc-800 pl-9"
                                    style={{ paddingLeft: "2.5rem" }}
                                />
                                <span className="absolute left-4 top-[38px] text-zinc-500 text-sm font-medium pointer-events-none">R$</span>
                            </div>
                            <div className="space-y-2 col-span-2">
                                <Label htmlFor="subscription_end_date">Data de Vencimento</Label>
                                <Input
                                    id="subscription_end_date"
                                    type="date"
                                    value={formData.subscription_end_date}
                                    onChange={(e) => setFormData({ ...formData, subscription_end_date: e.target.value })}
                                    className="bg-zinc-900 border-zinc-800 color-scheme-dark block w-full text-white"
                                    style={{ colorScheme: 'dark' }}
                                />
                            </div>
                        </div>
                        <div className="flex items-center justify-between rounded-lg border border-zinc-800 p-4 bg-zinc-900/50">
                            <div className="space-y-0.5">
                                <Label className="text-base">Agenda Ativa</Label>
                                <p className="text-xs text-zinc-500">
                                    Desativar irá impedir novos agendamentos.
                                </p>
                            </div>
                            <Switch
                                checked={formData.is_active}
                                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                                className="data-[state=checked]:bg-[#DBC278] data-[state=unchecked]:bg-zinc-600 border-zinc-500"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsEditModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSave} className="bg-[#DBC278] text-black hover:bg-[#c4ad6b]">
                            <Save className="w-4 h-4 mr-2" />
                            Salvar Alterações
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <QrCodeModal
                isOpen={isQrModalOpen}
                onOpenChange={setIsQrModalOpen}
                shop={qrShop}
            />

        </div>
    )
}
