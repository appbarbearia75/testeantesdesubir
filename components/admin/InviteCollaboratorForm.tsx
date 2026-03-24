"use client";

import React, { useState } from "react";
import { 
  Copy, 
  Check, 
  Link as LinkIcon, 
  User, 
  Briefcase, 
  Calendar, 
  DollarSign, 
  Shield, 
  Loader2, 
  RotateCcw,
  AlertCircle
} from "lucide-react";

// Presumindo a existência destes componentes do Shadcn UI baseados na listagem do diretório
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";

type Role = "colaborador" | "freelance" | null;

interface Permissions {
  agenda: boolean;
  financial: boolean;
}

export function InviteCollaboratorForm({ barbershopId }: { barbershopId: string }) {
  const [role, setRole] = useState<Role>(null);
  const [permissions, setPermissions] = useState<Permissions>({
    agenda: true, // Default: ativo e obrigatório
    financial: false, // Default: desativado
  });
  const [commission, setCommission] = useState<string>("40");
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handlePermissionChange = (key: keyof Permissions, value: boolean) => {
    // Acesso à agenda é obrigatório, não pode ser desativado
    if (key === "agenda" && !value) return;
    setPermissions((prev) => ({ ...prev, [key]: value }));
  };

  const handleCommissionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, ""); // Apenas números
    if (val !== "") {
      const numVal = parseInt(val, 10);
      if (numVal > 100) val = "100";
    }
    setCommission(val);
  };

  const copyToClipboard = async () => {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Falha ao copiar:", err);
    }
  };

  const resetForm = () => {
    setRole(null);
    setPermissions({ agenda: true, financial: false });
    setCommission("40");
    setInviteLink(null);
    setError(null);
    setCopied(false);
  };

  const generateInvite = async () => {
    if (!role) {
      setError("Por favor, selecione o tipo de usuário.");
      return;
    }

    if (!commission || parseInt(commission, 10) < 0 || parseInt(commission, 10) > 100) {
      setError("Comissão inválida. Defina um valor entre 0 e 100.");
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barbershop_id: barbershopId,
          role,
          commission: parseInt(commission, 10),
          permissions
        })
      });

      const data = await response.json();

      if (!response.ok || !data.code) {
        throw new Error(data.error || "Erro ao gerar convite.");
      }

      const host = typeof window !== 'undefined' ? window.location.origin : 'https://titobarbearia.com';
      const generatedLink = `${host}/convite/${data.code}`;
      
      setInviteLink(generatedLink);
    } catch (err: any) {
      setError(err.message || "Ocorreu um erro ao gerar o convite. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="max-w-4xl mx-auto border-[var(--border-color)] shadow-2xl overflow-hidden backdrop-blur-md bg-[var(--bg-card)] text-[var(--text-primary)]">
      <CardHeader className="pb-4 pt-5 px-6 border-b border-[var(--border-color)] bg-[var(--bg-card)]">
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          <div className="bg-yellow-400/10 p-1.5 rounded-lg shadow-[0_0_15px_rgba(250,204,21,0.15)]">
            <LinkIcon className="h-5 w-5 text-yellow-500" />
          </div>
          <span className="bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent drop-shadow-sm">Gerar Convite</span>
        </CardTitle>
        <CardDescription className="text-sm mt-1 text-[var(--text-secondary)]">
          Crie um link de acesso exclusivo para novos colaboradores ou freelancers.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6 pt-6 px-6">
        {/* RESULTADO (Mostrado quando o link é gerado com sucesso) */}
        {inviteLink && (
          <div className="bg-green-500/10 border-2 border-green-500/30 p-6 rounded-xl space-y-5 animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-500 shadow-[0_0_30px_rgba(34,197,94,0.15)] relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
              <Check className="h-20 w-20 text-green-500" />
            </div>
            
            <div className="flex items-start gap-3 relative z-10">
              <div className="bg-green-500 text-neutral-950 p-2 rounded-lg shadow-[0_0_15px_rgba(34,197,94,0.4)]">
                <Check className="h-6 w-6" strokeWidth={3} />
              </div>
              <div className="space-y-1 pt-0.5">
                <h3 className="text-lg font-bold text-green-400 drop-shadow-sm">Convite gerado com sucesso!</h3>
                <p className="text-sm text-[var(--text-secondary)]">
                  Envie o link abaixo para o <strong className="text-[var(--text-primary)]">{role === "colaborador" ? "colaborador" : "freelancer"}</strong> completar o cadastro.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2 relative z-10 pt-1">
              <Input 
                value={inviteLink} 
                readOnly 
                className="bg-[var(--bg-card)] backdrop-blur-sm text-sm font-medium font-mono h-11 border-green-500/30 text-[var(--text-primary)] focus-visible:ring-1 focus-visible:ring-green-500 shadow-inner rounded-lg"
              />
              <Button 
                onClick={copyToClipboard} 
                variant={copied ? "default" : "secondary"}
                className={`shrink-0 w-full sm:w-36 h-11 font-bold text-sm transition-all duration-300 rounded-lg ${copied ? 'bg-green-500 hover:bg-green-600 text-neutral-950 shadow-[0_0_15px_rgba(34,197,94,0.4)]' : 'bg-[var(--bg-card)] text-[var(--text-primary)] hover:bg-yellow-400 hover:text-neutral-950 hover:shadow-[0_0_15px_rgba(250,204,21,0.4)] hover:scale-[1.02]'}`}
              >
                {copied ? (
                  <><Check className="h-4 w-4 mr-2" strokeWidth={3} /> Copiado!</>
                ) : (
                  <><Copy className="h-4 w-4 mr-2" /> Copiar Link</>
                )}
              </Button>
            </div>
            
            <div className="flex justify-start sm:justify-end pt-3 border-t border-green-500/20 relative z-10">
              <Button onClick={resetForm} variant="ghost" size="sm" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] font-medium h-8 transition-colors rounded-lg">
                <RotateCcw className="h-3 w-3 mr-2" />
                Gerar novo convite
              </Button>
            </div>
          </div>
        )}

        {/* FORMULÁRIO (Oculto se já gerou o link para focar no resultado, ou mantido) */}
        {!inviteLink && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            
            {/* --- COLUNA ESQUERDA: Tipo e Comissão --- */}
            <div className="space-y-6">
              {/* 1. SELEÇÃO DE TIPO */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-[var(--border-color)]">
                  <User className="h-4 w-4 text-yellow-500" />
                  <h3 className="font-semibold text-base text-[var(--text-primary)] tracking-tight">Tipo de Usuário</h3>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setRole("colaborador")}
                    className={`group relative flex flex-col items-center justify-center p-4 rounded-xl transition-all duration-300 ease-out overflow-hidden border ${
                      role === "colaborador" 
                        ? "border-yellow-400 bg-yellow-400/10 shadow-[0_0_25px_rgba(250,204,21,0.2)] scale-[1.02] ring-1 ring-yellow-400 z-10" 
                        : "border-[var(--border-color)] bg-[var(--bg-card)] hover:border-yellow-400/40 hover:bg-yellow-400/5 hover:scale-[1.01]"
                    }`}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br from-yellow-400/10 to-transparent transition-opacity duration-300 ${role === "colaborador" ? "opacity-100" : "opacity-0"}`} />
                    {role === "colaborador" && (
                      <div className="absolute top-2 right-2 bg-yellow-400 text-neutral-950 rounded-full p-0.5 animate-in zoom-in-75 duration-200 shadow-[0_0_10px_rgba(250,204,21,0.5)]">
                        <Check className="h-3 w-3" strokeWidth={3} />
                      </div>
                    )}
                    <Briefcase className={`h-6 w-6 mb-2 transition-all duration-300 ${role === "colaborador" ? "text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" : "text-neutral-500 group-hover:text-yellow-400/80"}`} />
                    <span className={`font-semibold text-sm transition-colors duration-300 ${role === "colaborador" ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]"}`}>
                      Colaborador
                    </span>
                    <span className="text-[11px] text-[var(--text-muted)] mt-0.5 text-center font-medium leading-tight group-hover:text-[var(--text-secondary)] transition-colors">Fixo ou CLT</span>
                  </button>

                  <button
                    onClick={() => setRole("freelance")}
                    className={`group relative flex flex-col items-center justify-center p-4 rounded-xl transition-all duration-300 ease-out overflow-hidden border ${
                      role === "freelance" 
                        ? "border-yellow-400 bg-yellow-400/10 shadow-[0_0_25px_rgba(250,204,21,0.2)] scale-[1.02] ring-1 ring-yellow-400 z-10" 
                        : "border-[var(--border-color)] bg-[var(--bg-card)] hover:border-yellow-400/40 hover:bg-yellow-400/5 hover:scale-[1.01]"
                    }`}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br from-yellow-400/10 to-transparent transition-opacity duration-300 ${role === "freelance" ? "opacity-100" : "opacity-0"}`} />
                    {role === "freelance" && (
                      <div className="absolute top-2 right-2 bg-yellow-400 text-neutral-950 rounded-full p-0.5 animate-in zoom-in-75 duration-200 shadow-[0_0_10px_rgba(250,204,21,0.5)]">
                        <Check className="h-3 w-3" strokeWidth={3} />
                      </div>
                    )}
                    <User className={`h-6 w-6 mb-2 transition-all duration-300 ${role === "freelance" ? "text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" : "text-neutral-500 group-hover:text-yellow-400/80"}`} />
                    <span className={`font-semibold text-sm transition-colors duration-300 ${role === "freelance" ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]"}`}>
                      Freelancer
                    </span>
                    <span className="text-[11px] text-[var(--text-muted)] mt-0.5 text-center font-medium leading-tight group-hover:text-[var(--text-secondary)] transition-colors">Horários flexíveis</span>
                  </button>
                </div>
              </div>

              {/* 3. COMISSÃO */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-[var(--border-color)]">
                  <DollarSign className="h-4 w-4 text-yellow-500" />
                  <h3 className="font-semibold text-base text-[var(--text-primary)] tracking-tight">Comissão Padrão</h3>
                </div>
                
                <div className="flex items-center gap-4 bg-gradient-to-br from-yellow-400/5 to-transparent border border-yellow-400/20 rounded-xl p-4 shadow-[0_0_15px_rgba(250,204,21,0.05)] transition-all hover:border-yellow-400/40 hover:shadow-[0_0_20px_rgba(250,204,21,0.1)] group">
                  <div className="relative w-28 shrink-0">
                    <Input 
                      type="text" 
                      value={commission}
                      onChange={handleCommissionChange}
                      className="pr-6 text-right font-bold text-xl h-11 bg-[var(--bg-input)] border-[var(--border-color)] text-[var(--text-primary)] focus-visible:ring-2 focus-visible:ring-yellow-400 focus-visible:border-yellow-400 shadow-inner group-hover:border-yellow-400/50 transition-all duration-300 rounded-lg outline-none"
                      placeholder="0"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-yellow-500 font-bold text-base">
                      %
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    <p className="font-semibold text-[var(--text-primary)] text-sm">
                      Porcentagem
                    </p>
                    <p className="text-[11px] text-neutral-500 leading-tight">
                      Ganho padrão por serviço.<br />Alterável caso a caso depois.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* --- COLUNA DIREITA: Permissões --- */}
            <div className="space-y-6">
              {/* 2. PERMISSÕES */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-[var(--border-color)]">
                  <Shield className="h-4 w-4 text-yellow-500" />
                  <h3 className="font-semibold text-base text-[var(--text-primary)] tracking-tight">Permissões do Sistema</h3>
                </div>
                
                <div className="space-y-0 relative overflow-hidden bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] shadow-sm divide-y divide-[var(--border-color)]">
                  {/* Agenda */}
                  <div className="flex items-center justify-between p-4 hover:bg-[var(--bg-hover)] transition-colors group">
                    <div className="space-y-1">
                      <Label className="text-sm flex items-center gap-2 cursor-pointer font-semibold text-[var(--text-primary)] group-hover:text-yellow-400 transition-colors">
                        <Calendar className="h-4 w-4 text-yellow-500 opacity-80 group-hover:opacity-100 transition-opacity drop-shadow-[0_0_5px_rgba(250,204,21,0.3)]" />
                        Acesso à Agenda
                      </Label>
                      <p className="text-xs text-[var(--text-muted)] pl-6 group-hover:text-[var(--text-secondary)] transition-colors">
                        Visualizar e gerenciar horários.
                      </p>
                    </div>
                    <Switch 
                      checked={permissions.agenda} 
                      onCheckedChange={(val) => handlePermissionChange("agenda", val)}
                      disabled={true} // Obrigatório
                      className="data-[state=checked]:bg-yellow-400 data-[state=checked]:shadow-[0_0_10px_rgba(250,204,21,0.5)] bg-neutral-700"
                    />
                  </div>

                  {/* Financeiro */}
                  <div className="flex items-center justify-between p-4 hover:bg-[var(--bg-hover)] transition-colors group">
                    <div className="space-y-1">
                      <Label htmlFor="financial-access" className="text-sm flex items-center gap-2 cursor-pointer font-semibold text-[var(--text-primary)] group-hover:text-yellow-400 transition-colors">
                        <DollarSign className={`h-4 w-4 transition-all ${permissions.financial ? "text-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.5)]" : "text-neutral-500 group-hover:text-yellow-500"} `} />
                        Acesso Financeiro
                      </Label>
                      <p className="text-xs text-[var(--text-muted)] pl-6 group-hover:text-[var(--text-secondary)] transition-colors">
                        Visualizar faturamento e relatórios.
                      </p>
                    </div>
                    <Switch 
                      id="financial-access"
                      checked={permissions.financial} 
                      onCheckedChange={(val) => handlePermissionChange("financial", val)}
                      className="data-[state=checked]:bg-yellow-400 data-[state=checked]:shadow-[0_0_10px_rgba(250,204,21,0.5)] bg-neutral-700 transition-all border-neutral-600"
                    />
                  </div>
                </div>
              </div>

              {/* ERRO MENSAGEM */}
              {error && (
                <div className="flex items-center gap-2 text-red-400 bg-red-950/40 border border-red-900/50 p-3 rounded-lg text-sm animate-in fade-in zoom-in-95 duration-200 shadow-sm">
                  <AlertCircle className="h-4 w-4 shrink-0 drop-shadow-[0_0_5px_rgba(248,113,113,0.5)]" />
                  <p>{error}</p>
                </div>
              )}
            </div>
            
          </div>
        )}
      </CardContent>

      {!inviteLink && (
        <CardFooter className="pt-4 pb-5 px-6 border-t border-[var(--border-color)] bg-[var(--bg-card)]">
          <Button 
            onClick={generateInvite} 
            disabled={isLoading}
            className="w-full sm:w-auto sm:ml-auto h-12 px-10 text-sm font-bold uppercase tracking-wide transition-all duration-300 bg-yellow-400 text-neutral-950 hover:bg-yellow-300 shadow-[0_0_20px_rgba(250,204,21,0.3)] hover:shadow-[0_0_35px_rgba(250,204,21,0.6)] hover:-translate-y-1 hover:scale-[1.03] active:scale-95 disabled:opacity-70 disabled:hover:scale-100 disabled:hover:-translate-y-0 disabled:hover:shadow-none rounded-lg"
          >
            {isLoading ? (
              <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Gerando convite...</>
            ) : (
              "Gerar Convite"
            )}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
