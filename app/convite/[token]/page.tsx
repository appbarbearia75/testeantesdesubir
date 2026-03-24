"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Mail, Lock, AlertTriangle, AlertCircle, CheckCircle2, Users, Briefcase, User, Phone } from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"

interface InviteData {
    code: string
    barbershop_id: string
    barbershop_name: string
    barbershop_slug: string
    role: string
    commission: number
    permissions: { agenda: boolean; financial: boolean }
}

export default function InviteRegisterPage() {
    const params = useParams()
    const router = useRouter()
    const token = params.token as string

    const [isValid, setIsValid] = useState<boolean | null>(null)
    const [invite, setInvite] = useState<InviteData | null>(null)
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [name, setName] = useState("")
    const [phone, setPhone] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState(false)

    useEffect(() => {
        if (token) {
            checkInvite(token)
        }
    }, [token])

    const checkInvite = async (inviteCode: string) => {
        try {
            const res = await fetch(`/api/invites?code=${inviteCode}`)
            const data = await res.json()
            if (data.valid && data.invite) {
                setIsValid(true)
                setInvite(data.invite)
            } else {
                setIsValid(false)
            }
        } catch (error) {
            setIsValid(false)
        }
    }

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!invite) return

        setLoading(true)
        setError("")

        try {
            // 1. Chamar API Route para criar usuário e vincular à barbearia atomicamente no backend
            const acceptRes = await fetch('/api/invites/accept', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code: invite.code,
                    email,
                    password,
                    name,
                    phone
                })
            })

            const acceptData = await acceptRes.json()

            if (!acceptRes.ok || !acceptData.success) {
                console.error("Erro ao aceitar convite via API:", acceptData)
                throw new Error(acceptData.error || "Erro ao realizar cadastro. Tente novamente.")
            }

            // 2. Sucesso
            setSuccess(true)

        } catch (err: any) {
            console.error("Registration error:", err)
            let msg = err.message || "Erro ao realizar cadastro."
            
            // Traduzir mensagens comuns
            if (msg.includes("Password should be at least") || msg.includes("mínimo 6 caracteres")) {
                msg = "A senha deve ter no mínimo 6 caracteres."
            } else if (msg.includes("email rate limit") || msg.includes("Muitas tentativas")) {
                msg = "Muitas tentativas. Aguarde alguns minutos e tente novamente."
            } else if (msg.includes("already registered") || msg.includes("já está cadastrado")) {
                msg = "Este e-mail já está cadastrado. Faça login ou use outro e-mail."
            } else if (msg.includes("já vinculado")) {
                msg = "Este usuário já está vinculado a uma barbearia."
            } else if (msg.includes("configuração") || msg.includes("SERVICE_ROLE")) {
                msg = "Erro de configuração do servidor. Entre em contato com o administrador."
            }
            
            setError(msg)
        } finally {
            setLoading(false)
        }
    }

    // Estado: Verificando
    if (isValid === null) {
        return (
            <div className="min-h-screen bg-[#09090b] flex items-center justify-center text-white">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-2 border-[#DBC278] border-t-transparent rounded-full animate-spin" />
                    <p className="text-zinc-400 text-sm">Verificando convite...</p>
                </div>
            </div>
        )
    }

    // Estado: Convite inválido
    if (isValid === false) {
        return (
            <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center p-6 text-white font-sans">
                <div className="text-center max-w-md">
                    <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-red-500/20">
                        <AlertTriangle className="w-10 h-10 text-red-400" />
                    </div>
                    <h1 className="text-2xl font-bold mb-4">Convite Inválido ou Expirado</h1>
                    <p className="text-zinc-500 mb-8">
                        O link que você acessou não é válido ou já foi utilizado.
                        Entre em contato com o administrador para solicitar um novo convite.
                    </p>
                    <Link href="/">
                        <Button className="bg-zinc-800 hover:bg-zinc-700 text-white">
                            Voltar ao Início
                        </Button>
                    </Link>
                </div>
            </div>
        )
    }

    // Estado: Cadastro realizado com sucesso
    if (success) {
        return (
            <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center p-6 text-white font-sans">
                <div className="text-center max-w-md">
                    <div className="w-20 h-20 bg-green-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-green-500/20 shadow-[0_0_40px_-10px_rgba(34,197,94,0.3)]">
                        <CheckCircle2 className="w-10 h-10 text-green-400" />
                    </div>
                    <h1 className="text-2xl font-bold mb-3">Cadastro Realizado!</h1>
                    <p className="text-zinc-400 mb-2">
                        Sua conta foi criada com sucesso e você já está vinculado à barbearia <strong className="text-white">{invite?.barbershop_name}</strong>.
                    </p>
                    <p className="text-zinc-500 text-sm mb-8">
                        Verifique seu e-mail para confirmar a conta e depois faça login.
                    </p>
                    <Link href="/login">
                        <Button className="bg-[#DBC278] hover:bg-[#c9b06b] text-black font-bold h-12 px-8 rounded-xl shadow-[0_0_20px_rgba(219,194,120,0.2)] hover:shadow-[0_0_30px_rgba(219,194,120,0.4)] transition-all">
                            Fazer Login
                        </Button>
                    </Link>
                </div>
            </div>
        )
    }

    // Estado: Formulário de cadastro
    const roleLabels: Record<string, string> = {
        'colaborador': 'Colaborador',
        'freelance': 'Freelancer',
        'admin': 'Administrador'
    }

    const roleIcons: Record<string, React.ReactNode> = {
        'colaborador': <Briefcase className="w-4 h-4" />,
        'freelance': <User className="w-4 h-4" />,
        'admin': <Users className="w-4 h-4" />
    }

    return (
        <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center p-6 text-white font-sans selection:bg-[#DBC278] selection:text-black">
            <div className="w-full max-w-sm">
                <div className="flex justify-center mb-6">
                    <div className="w-20 h-20 bg-[#DBC278]/10 rounded-3xl flex items-center justify-center border border-[#DBC278]/20 shadow-[0_0_40px_-10px_rgba(219,194,120,0.3)]">
                        <img
                            src="/simbol-logo.svg"
                            alt="Logo"
                            className="w-10 h-10"
                        />
                    </div>
                </div>

                <h1 className="text-2xl font-bold text-center mb-2">Você foi convidado!</h1>
                
                {/* Info do convite */}
                <div className="bg-[#1c1c1c] border border-zinc-800 rounded-xl p-4 mb-6 mt-4">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-[#DBC278]/10 rounded-lg flex items-center justify-center border border-[#DBC278]/20">
                            <Users className="w-5 h-5 text-[#DBC278]" />
                        </div>
                        <div>
                            <p className="font-bold text-white text-sm">{invite?.barbershop_name}</p>
                            <p className="text-zinc-500 text-xs">Barbearia</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 bg-[#DBC278]/5 border border-[#DBC278]/15 rounded-lg px-3 py-2">
                        <span className="text-[#DBC278]">
                            {invite?.role ? roleIcons[invite.role] : <User className="w-4 h-4" />}
                        </span>
                        <span className="text-sm text-zinc-300">
                            Nível de acesso: <strong className="text-[#DBC278]">{invite?.role ? roleLabels[invite.role] : 'Colaborador'}</strong>
                        </span>
                    </div>
                </div>

                <p className="text-zinc-500 text-center mb-6 text-sm">Crie sua conta para começar.</p>

                <form onSubmit={handleRegister} className="space-y-4">
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                        <Input
                            type="text"
                            placeholder="Seu Nome Completo"
                            className="pl-10 h-12 bg-[#1c1c1c] border-zinc-800 text-white placeholder:text-zinc-600 focus:border-[#DBC278] transition-colors"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>

                    <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                        <Input
                            type="tel"
                            placeholder="Seu WhatsApp"
                            className="pl-10 h-12 bg-[#1c1c1c] border-zinc-800 text-white placeholder:text-zinc-600 focus:border-[#DBC278] transition-colors"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            required
                        />
                    </div>

                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                        <Input
                            type="email"
                            placeholder="Seu e-mail"
                            className="pl-10 h-12 bg-[#1c1c1c] border-zinc-800 text-white placeholder:text-zinc-600 focus:border-[#DBC278] transition-colors"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                        <Input
                            type="password"
                            placeholder="Senha segura"
                            className="pl-10 h-12 bg-[#1c1c1c] border-zinc-800 text-white placeholder:text-zinc-600 focus:border-[#DBC278] transition-colors"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                        />
                        <p className="text-xs text-zinc-600 mt-1 ml-1">Mínimo de 6 caracteres.</p>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 text-red-500 text-sm bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            {error}
                        </div>
                    )}

                    <Button
                        type="submit"
                        className="w-full h-12 bg-[#DBC278] hover:bg-[#c9b06b] text-black font-bold text-base rounded-xl mt-2 shadow-[0_0_20px_rgba(219,194,120,0.2)] hover:shadow-[0_0_30px_rgba(219,194,120,0.4)] transition-all"
                        disabled={loading}
                    >
                        {loading ? "Criando Conta..." : "Criar Conta e Entrar"}
                    </Button>
                </form>

                <p className="text-center mt-8 text-sm text-zinc-400">
                    Já tem uma conta? <Link href="/login" className="text-[#DBC278] hover:underline font-medium">Fazer Login</Link>
                </p>
            </div>
        </div>
    )
}
