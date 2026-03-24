"use client"

import React, { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Check, Download, Smartphone, MapPin } from "lucide-react"
import { QRCodeSVG } from "qrcode.react"

interface QrCodeModalProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    shop: any
}

export default function QrCodeModal({ isOpen, onOpenChange, shop }: QrCodeModalProps) {
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)

    const downloadPdfArt = async () => {
        const artContainer = document.getElementById("pdf-art-container")
        if (!artContainer) return

        setIsGeneratingPdf(true)

        try {
            // Dynamic imports only on the client-side
            const { toPng } = await import("html-to-image")
            const { default: jsPDF } = await import("jspdf")

            await new Promise(r => setTimeout(r, 100))

            const dataUrl = await toPng(artContainer, {
                pixelRatio: 4, // High quality A6
                cacheBust: true,
                backgroundColor: "#111111",
            })

            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a6'
            })

            pdf.addImage(dataUrl, 'PNG', 0, 0, 105, 148)
            pdf.save(`qrcode-${shop?.slug}.pdf`)
        } catch (error) {
            console.error("Error generating PDF:", error)
            alert("Erro ao gerar PDF.")
        } finally {
            setIsGeneratingPdf(false)
        }
    }

    if (!shop) return null

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-primary)] sm:max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Cartaz da Barbearia</DialogTitle>
                    <DialogDescription>
                        Preview da arte em formato A6. Clique em baixar para gerar o PDF.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex justify-center w-full py-4 bg-black/40 rounded-xl overflow-hidden h-[500px] items-center">
                    <div style={{ transform: 'scale(0.75)', transformOrigin: 'center' }}>
                        <div
                            id="pdf-art-container"
                            style={{ width: "420px", height: "595px", backgroundColor: "var(--bg-card)", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", alignItems: "center", fontFamily: "sans-serif" }}
                        >
                            {/* Cover Photo */}
                            <div style={{ width: "100%", height: "160px", position: "relative", flexShrink: 0 }}>
                                {shop.cover_url ? (
                                    <img
                                        src={shop.cover_url}
                                        crossOrigin="anonymous"
                                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                        alt="Cover"
                                    />
                                ) : (
                                    <div style={{ width: "100%", height: "100%", backgroundColor: "var(--border-color)" }} />
                                )}
                                <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "linear-gradient(to bottom, rgba(17,17,17,0) 0%, rgba(17,17,17,0.5) 50%, rgba(17,17,17,1) 100%)" }} />
                            </div>

                            {/* Profile Photo */}
                            <div style={{ marginTop: "-56px", zIndex: 10, padding: "6px", backgroundColor: "var(--bg-card)", borderRadius: "9999px", flexShrink: 0 }}>
                                <div style={{ width: "100px", height: "100px", borderRadius: "9999px", overflow: "hidden", border: "3px solid #DBC278", backgroundColor: "var(--bg-card)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    {shop.avatar_url ? (
                                        <img
                                            src={shop.avatar_url}
                                            crossOrigin="anonymous"
                                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                            alt="Avatar"
                                        />
                                    ) : (
                                        <span style={{ fontSize: "28px", fontWeight: "bold", color: "#52525b" }}>
                                            {shop.name?.substring(0, 2).toUpperCase()}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Name */}
                            <h1 style={{ marginTop: "16px", fontSize: "24px", fontWeight: 900, textAlign: "center", textTransform: "uppercase", padding: "0 24px", color: "#ffffff", letterSpacing: "0.05em", lineHeight: 1.1, flexShrink: 0, width: "100%", wordBreak: "break-word" }}>
                                {shop.name}
                            </h1>

                            <p style={{ marginTop: "6px", fontSize: "14px", fontWeight: "bold", letterSpacing: "0.2em", color: "#DBC278", flexShrink: 0 }}>
                                AGENDE PELO APP
                            </p>

                            {/* QR Code */}
                            <div style={{ marginTop: "24px", padding: "16px", backgroundColor: "#ffffff", borderRadius: "24px", flexShrink: 0, boxShadow: "0 0 40px rgba(219,194,120,0.15)" }}>
                                <QRCodeSVG
                                    value={`${window.location.origin}/${shop.slug}`}
                                    size={160}
                                    level="H"
                                    includeMargin={false}
                                />
                            </div>

                            {/* Bottom Info */}
                            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "16px 24px", backgroundColor: "rgba(255,255,255,0.03)", borderTop: "1px solid var(--bg-hover)", display: "flex", flexDirection: "column", alignItems: "center" }}>
                                {shop.phone && (
                                    <div style={{ display: "flex", alignItems: "center", fontSize: "18px", fontWeight: "bold", color: "#ffffff", marginBottom: "8px" }}>
                                        <Smartphone size={22} color="#DBC278" style={{ marginRight: "8px" }} />
                                        {shop.phone.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3")}
                                    </div>
                                )}
                                {shop.address && (
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", color: "#a1a1aa", textAlign: "center" }}>
                                        <MapPin size={18} style={{ flexShrink: 0, marginRight: "8px" }} color="#DBC278" />
                                        <span style={{ lineHeight: 1.3 }}>{shop.address}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="flex flex-row justify-between sm:justify-between items-center sm:gap-0 mt-4">
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>
                        Fechar
                    </Button>
                    <Button
                        onClick={downloadPdfArt}
                        disabled={isGeneratingPdf}
                        className="bg-[#DBC278] text-black hover:bg-[#c4ad6b]"
                    >
                        {isGeneratingPdf ? <Check className="w-4 h-4 mr-2" /> : <Download className="w-4 h-4 mr-2" />}
                        {isGeneratingPdf ? "Gerando..." : "Baixar PDF (A6)"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
