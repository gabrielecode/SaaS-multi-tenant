import React from 'react';
import { ShieldAlert, Check, ArrowRight, Clock, Smartphone, CreditCard, Users, Building2, Lock, Sparkles } from 'lucide-react';

interface LandingPageProps {
  onOpenApp: () => void;
  onOpenStaffAuth: () => void;
}

export function LandingPage({ onOpenApp, onOpenStaffAuth }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#14161A] font-sans selection:bg-blue-100 selection:text-[#1450FF]">
      
      {/* ------------------------------------------------------------- */}
      {/* HEADER / NAVIGATION                                           */}
      {/* ------------------------------------------------------------- */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E4E6EA] px-4 sm:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#1450FF] rounded-[6px] flex items-center justify-center text-white font-bold">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <span className="font-display font-bold text-base tracking-tight text-[#14161A]">NoShow Reducer</span>
            <span className="hidden sm:inline-block ml-2 text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded-[4px] border border-[#E4E6EA]">
              SaaS Svizzera
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenStaffAuth}
            className="px-3.5 py-2 text-xs font-bold text-slate-700 hover:text-[#1450FF] bg-slate-50 hover:bg-slate-100 border border-[#E4E6EA] rounded-[4px] transition"
          >
            Accesso Saloni
          </button>
          <button
            onClick={onOpenApp}
            className="px-4 py-2 text-xs font-bold text-white bg-[#1450FF] hover:bg-blue-600 rounded-[4px] transition flex items-center gap-1.5"
          >
            <span>Prova Gratis</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* ------------------------------------------------------------- */}
      {/* 1. HERO SECTION                                               */}
      {/* ------------------------------------------------------------- */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-16 pb-20 text-center space-y-6">
        <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 px-3 py-1 rounded-[4px] text-xs font-bold text-[#1450FF]">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Soluzione dedicata a barbieri, estetiste e parrucchieri in Svizzera</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-display font-bold tracking-tight text-[#14161A] max-w-3xl mx-auto leading-tight">
          Ogni appuntamento bucato costa tempo e fatturato al tuo salone.
        </h1>

        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Elimina le mancate presentazioni (no-show) con caparre online obbligatorie al momento della prenotazione e promemoria automatici via WhatsApp e SMS.
        </p>

        {/* Numero Concreto Centrale */}
        <div className="py-6 max-w-md mx-auto bg-white border border-[#E4E6EA] rounded-[6px] p-6 shadow-sm">
          <div className="font-mono text-4xl sm:text-5xl font-extrabold text-[#1450FF]">
            14.8%
          </div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-2">
            Tasso medio di no-show nei saloni senza caparra preventiva
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <button
            onClick={onOpenApp}
            className="w-full sm:w-auto px-6 py-3 bg-[#1450FF] hover:bg-blue-600 text-white font-bold text-sm rounded-[4px] transition flex items-center justify-center gap-2"
          >
            <span>Inizia subito gratis</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={onOpenStaffAuth}
            className="w-full sm:w-auto px-6 py-3 bg-white hover:bg-slate-50 text-slate-700 border border-[#E4E6EA] font-bold text-sm rounded-[4px] transition"
          >
            Accedi come Titolare
          </button>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 2. IL PROBLEMA                                                */}
      {/* ------------------------------------------------------------- */}
      <section className="bg-white border-y border-[#E4E6EA] py-16 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto space-y-10">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <h2 className="text-2xl font-display font-bold text-[#14161A]">
              Quanto ti costa davvero un cliente che non si presenta?
            </h2>
            <p className="text-sm text-slate-600">
              Nel settore della bellezza e cura personale, un cliente assente senza preavviso non è solo un inconveniente: è un danno economico diretto.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#FAFAFA] p-6 rounded-[6px] border border-[#E4E6EA] space-y-3">
              <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-[4px] border border-rose-200 flex items-center justify-center font-mono font-bold text-sm">
                01
              </div>
              <h3 className="font-display font-bold text-base text-[#14161A]">Fatturato azzerato</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                La poltrona o il lettino rimangono vuoti nell'orario di punta. Il tempo del professionista è sprecato e non può essere recuperato lo stesso giorno.
              </p>
            </div>

            <div className="bg-[#FAFAFA] p-6 rounded-[6px] border border-[#E4E6EA] space-y-3">
              <div className="w-10 h-10 bg-amber-50 text-amber-700 rounded-[4px] border border-amber-200 flex items-center justify-center font-mono font-bold text-sm">
                02
              </div>
              <h3 className="font-display font-bold text-base text-[#14161A]">Clienti in attesa respinti</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Hai rifiutato altri clienti perché l'orario risultava occupato da chi poi non si è presentato, perdendo doppia opportunità di guadagno.
              </p>
            </div>

            <div className="bg-[#FAFAFA] p-6 rounded-[6px] border border-[#E4E6EA] space-y-3">
              <div className="w-10 h-10 bg-blue-50 text-[#1450FF] rounded-[4px] border border-blue-200 flex items-center justify-center font-mono font-bold text-sm">
                03
              </div>
              <h3 className="font-display font-bold text-base text-[#14161A]">Tempo perso a inseguire</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Telefonate manuali e messaggi di conferma che rubano ore preziose al personale del salone, spesso senza ricevere risposta in tempo utile.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 3. COME FUNZIONA (3 STEP)                                     */}
      {/* ------------------------------------------------------------- */}
      <section className="max-w-5xl mx-auto py-20 px-4 sm:px-6 space-y-12">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <span className="text-xs font-mono font-bold text-[#1450FF] uppercase tracking-wider">Processo automatico</span>
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-[#14161A]">
            Come NoShow Reducer risolve il problema in 3 step
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-[6px] border border-[#E4E6EA] space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-[#1450FF] bg-blue-50 px-2.5 py-1 rounded-[4px] border border-blue-200">
                Step 1
              </span>
              <CreditCard className="w-5 h-5 text-slate-400" />
            </div>
            <h3 className="font-display font-bold text-lg text-[#14161A]">Caparra online obbligatoria</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Durante la prenotazione dal link del salone, il cliente versa una piccola caparra (es. 20 CHF o EUR) tramite carta o Twint. Chi non intende presentarsi desiste subito.
            </p>
          </div>

          <div className="bg-white p-6 rounded-[6px] border border-[#E4E6EA] space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-[#1450FF] bg-blue-50 px-2.5 py-1 rounded-[4px] border border-blue-200">
                Step 2
              </span>
              <Smartphone className="w-5 h-5 text-slate-400" />
            </div>
            <h3 className="font-display font-bold text-lg text-[#14161A]">Promemoria WhatsApp & SMS</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Il sistema invia promemoria automatici 24 ore prima dell'appuntamento con un pulsante diretto per confermare o disdire in un solo tap.
            </p>
          </div>

          <div className="bg-white p-6 rounded-[6px] border border-[#E4E6EA] space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-[#1450FF] bg-blue-50 px-2.5 py-1 rounded-[4px] border border-blue-200">
                Step 3
              </span>
              <Users className="w-5 h-5 text-slate-400" />
            </div>
            <h3 className="font-display font-bold text-lg text-[#14161A]">Lista d'attesa intelligente</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Se un cliente cancella in anticipo, il sistema avvisa automaticamente i clienti in lista d'attesa via WhatsApp. Lo slot viene riprenotato in pochi minuti.
            </p>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 4. PER CHI È PENSTATO                                         */}
      {/* ------------------------------------------------------------- */}
      <section className="bg-white border-t border-[#E4E6EA] py-16 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto space-y-10">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <h2 className="text-2xl font-display font-bold text-[#14161A]">
              Progettato specificamente per la tua attività
            </h2>
            <p className="text-sm text-slate-600">
              Niente software complessi e generici. NoShow Reducer è calibrato sulle reali esigenze operative dei saloni svizzeri.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#FAFAFA] p-6 rounded-[6px] border border-[#E4E6EA] space-y-2">
              <h3 className="font-display font-bold text-base text-[#14161A]">Barber Shop</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Gestione rapida dei tagli uomo e rasatura barba, flussi snelli per clienti fidelizzati e slot ravvicinati.
              </p>
            </div>

            <div className="bg-[#FAFAFA] p-6 rounded-[6px] border border-[#E4E6EA] space-y-2">
              <h3 className="font-display font-bold text-base text-[#14161A]">Centri Estetici</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Protezione dei trattamenti lunghi (ceretta, viso, laser) dove un'assenza improvvisa blocca l'operatrice per oltre un'ora.
              </p>
            </div>

            <div className="bg-[#FAFAFA] p-6 rounded-[6px] border border-[#E4E6EA] space-y-2">
              <h3 className="font-display font-bold text-base text-[#14161A]">Saloni di Parrucchieri</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Controllo perfetto su pieghe, colore e trattamenti tecnici complessi, con gestione multi-operatore per poltrona.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 5. CTA FINALE & FOOTER                                        */}
      {/* ------------------------------------------------------------- */}
      <section className="py-20 px-4 sm:px-6 text-center space-y-6 max-w-3xl mx-auto">
        <h2 className="text-3xl font-display font-bold text-[#14161A]">
          Pronto a eliminare i no-show dal tuo salone?
        </h2>
        <p className="text-sm text-slate-600">
          Configura il tuo salone in meno di 3 minuti e inizia subito a ricevere caparre protette e conferme automatiche.
        </p>
        <div className="pt-2">
          <button
            onClick={onOpenApp}
            className="px-8 py-3.5 bg-[#1450FF] hover:bg-blue-600 text-white font-bold text-sm rounded-[4px] transition inline-flex items-center gap-2"
          >
            <span>Apri NoShow Reducer</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      <footer className="bg-white border-t border-[#E4E6EA] py-8 px-4 sm:px-8 text-center sm:flex sm:items-center sm:justify-between text-xs text-slate-500">
        <div className="flex items-center justify-center sm:justify-start gap-2 mb-3 sm:mb-0">
          <div className="w-5 h-5 bg-[#1450FF] rounded-[4px] flex items-center justify-center text-white font-bold text-[10px]">
            N
          </div>
          <span className="font-bold text-[#14161A]">NoShow Reducer SaaS</span>
          <span>© 2026 Tutti i diritti riservati</span>
        </div>
        <div className="flex items-center justify-center gap-4">
          <button onClick={onOpenStaffAuth} className="hover:text-[#1450FF] transition">
            Area Riservata Titolari
          </button>
          <span>•</span>
          <span>Svizzera (CH) • GDPR & LPD Compliant</span>
        </div>
      </footer>

    </div>
  );
}
