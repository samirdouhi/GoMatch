"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Store, 
  MapPin, 
  Camera, 
  Clock, 
  CheckCircle2, 
  ArrowRight, 
  Info,
  ChevronLeft
} from "lucide-react";
import Link from "next/link";

export default function AjouterCommercePage() {
  const [step, setStep] = useState(1);
  const totalSteps = 3;

  const nextStep = () => setStep((s) => Math.min(s + 1, totalSteps));
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  return (
    <main className="relative min-h-screen py-12 lg:py-20">
      <div className="mx-auto w-full max-w-4xl px-6 relative z-10">
        
        {/* HEADER DE LA PAGE */}
        <header className="mb-12">
          <Link 
            href="/aide" 
            className="group flex items-center gap-2 text-zinc-500 hover:text-white transition-colors mb-6 text-sm font-bold uppercase tracking-widest"
          >
            <ChevronLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Retour
          </Link>
          
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-amber-500 shadow-xl shadow-amber-500/5">
              <Store className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-white uppercase italic">
                Ajouter votre <span className="text-amber-500 not-italic">Commerce</span>
              </h1>
              <p className="text-zinc-500 text-sm font-bold tracking-widest uppercase mt-1">Rejoindre l&apos;écosystème GoMatch 2030</p>
            </div>
          </div>
        </header>

        {/* INDICATEUR DE PROGRESSION */}
        <div className="flex gap-2 mb-10">
          {[1, 2, 3].map((i) => (
            <div 
              key={i} 
              className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                i <= step ? "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]" : "bg-white/5"
              }`} 
            />
          ))}
        </div>

        <section className="rounded-[2.5rem] border border-white/5 bg-black/40 backdrop-blur-2xl p-8 md:p-12 shadow-2xl relative overflow-hidden">
          {/* ÉLÉMENT DÉCO ARRIÈRE-PLAN */}
          <div className="absolute -top-24 -right-24 h-64 w-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

          <form onSubmit={(e) => e.preventDefault()}>
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="flex items-center gap-2 text-amber-500 mb-2">
                    <Info className="h-4 w-4" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em]">Informations Générales</span>
                  </div>
                  
                  <div className="grid gap-6">
                    <div className="grid gap-2">
                      <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest ml-1">Nom de l&apos;établissement</label>
                      <input 
                        className="w-full h-14 rounded-2xl bg-white/5 border border-white/10 px-5 text-white outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all"
                        placeholder="Ex: Café de la Kasbah"
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest ml-1">Type de commerce</label>
                      <select className="w-full h-14 rounded-2xl bg-white/5 border border-white/10 px-5 text-white outline-none focus:border-amber-500/50 appearance-none">
                        <option className="bg-zinc-900">Artisanat local</option>
                        <option className="bg-zinc-900">Café traditionnel</option>
                        <option className="bg-zinc-900">Restauration</option>
                        <option className="bg-zinc-900">Coopérative</option>
                      </select>
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="flex items-center gap-2 text-amber-500 mb-2">
                    <MapPin className="h-4 w-4" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em]">Localisation & Contact</span>
                  </div>

                  <div className="grid gap-6">
                    <div className="grid gap-2">
                      <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest ml-1">Adresse à Rabat / Casablanca / Marrakech</label>
                      <input 
                        className="w-full h-14 rounded-2xl bg-white/5 border border-white/10 px-5 text-white outline-none focus:border-amber-500/50 transition-all"
                        placeholder="Rue, quartier..."
                      />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest ml-1">Horaires d&apos;ouverture</label>
                      <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-5 h-14">
                        <Clock className="h-4 w-4 text-zinc-500" />
                        <input className="bg-transparent w-full text-white outline-none" placeholder="08:00 - 22:00" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="text-center py-6"
                >
                  <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                    <Camera className="h-10 w-10 animate-pulse" />
                  </div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-4">Valorisez votre patrimoine</h3>
                  <p className="text-zinc-500 text-sm max-w-md mx-auto leading-relaxed mb-8">
                    Ajoutez des photos authentiques de votre commerce pour attirer les supporters et touristes lors de la Coupe du Monde 2030.
                  </p>
                  <button className="px-8 py-4 rounded-2xl bg-white/5 border border-dashed border-white/20 text-white font-bold text-sm hover:border-amber-500/50 transition-all">
                    Téléverser des images
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-12 flex justify-between gap-4">
              {step > 1 && (
                <button 
                  type="button"
                  onClick={prevStep}
                  className="px-8 h-14 rounded-2xl border border-white/10 text-white font-bold uppercase tracking-widest text-xs hover:bg-white/5 transition-all"
                >
                  Précédent
                </button>
              )}
              
              <button 
                type="button"
                onClick={step === totalSteps ? undefined : nextStep}
                className={`ml-auto flex items-center gap-3 px-8 h-14 rounded-2xl font-black uppercase tracking-widest text-xs transition-all ${
                  step === totalSteps 
                  ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20" 
                  : "bg-amber-500 text-black shadow-lg shadow-amber-500/20 hover:scale-[1.02]"
                }`}
              >
                {step === totalSteps ? (
                  <>Finaliser l&apos;inscription <CheckCircle2 className="h-4 w-4" /></>
                ) : (
                  <>Suivant <ArrowRight className="h-4 w-4" /></>
                )}
              </button>
            </div>
          </form>
        </section>

        {/* FOOTER TIPS */}
        <footer className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6 opacity-60">
          <div className="flex items-start gap-4 p-6 rounded-3xl bg-white/5 border border-white/5">
            <CheckCircle2 className="h-5 w-5 text-amber-500 shrink-0" />
            <p className="text-xs text-zinc-400 leading-relaxed">
              <strong>Validation Rapide :</strong> Les comptes commerçants sont validés sous 24h par notre équipe locale.
            </p>
          </div>
          <div className="flex items-start gap-4 p-6 rounded-3xl bg-white/5 border border-white/5">
            <Info className="h-5 w-5 text-amber-500 shrink-0" />
            <p className="text-xs text-zinc-400 leading-relaxed">
              <strong>Visibilité 2030 :</strong> Votre fiche sera traduite automatiquement pour les supporters internationaux.
            </p>
          </div>
        </footer>
      </div>
    </main>
  );
}