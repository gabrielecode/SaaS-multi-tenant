import { 
  BookOpen, 
  Sparkles, 
  ShieldCheck, 
  Smartphone, 
  Users, 
  TrendingUp, 
  Clock, 
  CreditCard, 
  CheckCircle, 
  HelpCircle,
  PlayCircle
} from 'lucide-react';

export default function Instructions() {
  return (
    <div className="space-y-8 animate-fade-in text-slate-700">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-600" />
          Guida all'Uso & Manuale Tecnico
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Scopri come NoShow Reducer ti aiuta ad azzerare le disdette dell'ultimo minuto e ottimizzare le entrate del tuo business.
        </p>
      </div>

      {/* Hero Banner / Concept */}
      <div className="glass-card p-6 rounded-2xl border border-slate-200/80 relative overflow-hidden shadow-sm bg-gradient-to-r from-indigo-50 to-purple-50">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Sparkles className="w-40 h-40 text-indigo-600" />
        </div>
        <div className="max-w-xl space-y-3 relative z-10">
          <span className="bg-indigo-100 text-indigo-700 text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider shadow-sm border border-indigo-200">
            La nostra missione
          </span>
          <h3 className="text-lg font-bold text-slate-900">Abbattiamo i No-Show del 92%</h3>
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            I professionisti del benessere e dei servizi perdono in media il 15% del loro fatturato annuale a causa di clienti che dimenticano gli appuntamenti o disdicono all'ultimo minuto. 
            <strong className="text-indigo-700 font-semibold"> NoShow Reducer</strong> risolve questo problema introducendo una barriera psicologica ed economica: la caparra confirmatoria online unita a promemoria SMS intelligenti a un tocco.
          </p>
        </div>
      </div>

      {/* 3 Core Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-5 rounded-2xl border border-slate-200/60 space-y-3 shadow-sm">
          <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center border border-indigo-100">
            <CreditCard className="w-5 h-5 text-indigo-600" />
          </div>
          <h4 className="text-sm font-bold text-slate-900">1. Caparre Tutelate</h4>
          <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
            I clienti pagano una piccola quota subito (fissa o percentuale) tramite Stripe Sandbox per confermare la prenotazione, riducendo drasticamente l'impulso a non presentarsi.
          </p>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-200/60 space-y-3 shadow-sm">
          <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center border border-emerald-100">
            <Smartphone className="w-5 h-5 text-emerald-600" />
          </div>
          <h4 className="text-sm font-bold text-slate-900">2. SMS One-Tap</h4>
          <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
            Un sistema automatico invia promemoria sul telefono del cliente. Quest'ultimo può confermare la propria presenza o disdire in un secondo semplicemente toccando il link.
          </p>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-200/60 space-y-3 shadow-sm">
          <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center border border-amber-100">
            <Users className="w-5 h-5 text-amber-600" />
          </div>
          <h4 className="text-sm font-bold text-slate-900">3. Score Affidabilità</h4>
          <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
            Un algoritmo calcola la puntualità di ciascun cliente. Se un cliente ha uno storico negativo, il sistema richiede automaticamente la caparra del 100% per l'appuntamento successivo.
          </p>
        </div>
      </div>

      {/* Step by Step Guide */}
      <div className="glass-card p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider pb-3 border-b border-slate-100 flex items-center gap-2">
          <PlayCircle className="w-4 h-4 text-indigo-600" />
          Come Utilizzare l'Applicazione (Flusso Operativo)
        </h3>

        <div className="relative border-l-2 border-slate-200 ml-3.5 pl-6 space-y-8">
          {/* Step 1 */}
          <div className="relative">
            <div className="absolute -left-9.5 top-0 w-7 h-7 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center text-xs font-bold text-indigo-600 shadow-sm">
              1
            </div>
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Passo 1: Configura il tuo Listino Trattamenti</h4>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Naviga nella sezione <strong className="text-slate-900 font-semibold">Listino Servizi</strong>. Qui puoi inserire i trattamenti offerti, la loro durata e il prezzo. 
                Abilita l'opzione <strong className="text-indigo-600 font-semibold">"Richiedi Caparra Online"</strong> se desideri che quel servizio specifico richieda un acconto cauzionale e seleziona se vuoi ricevere una quota fissa (es. 15€) o una percentuale (es. 30%).
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="relative">
            <div className="absolute -left-9.5 top-0 w-7 h-7 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center text-xs font-bold text-indigo-600 shadow-sm">
              2
            </div>
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Passo 2: Definisci le tue Regole e connetti Stripe</h4>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Vai su <strong className="text-slate-900 font-semibold">Impostazioni & Policy</strong>. Qui puoi impostare il limite di tempo (ad esempio, 24 ore prima) entro cui i clienti possono disdire gratuitamente. Se disdicono dopo, la caparra viene trattenuta.
                Inoltre, connetti l'account <strong className="text-emerald-600 font-semibold">Stripe Connect</strong> (in modalità di prova sandbox) con un solo clic per simulare i pagamenti.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="relative">
            <div className="absolute -left-9.5 top-0 w-7 h-7 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center text-xs font-bold text-indigo-600 shadow-sm">
              3
            </div>
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Passo 3: Testa la prenotazione dal punto di vista del Cliente</h4>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Cambia modalità di visualizzazione in alto a destra cliccando su <strong className="text-indigo-600 font-semibold">"Link Pubblico Cliente"</strong>. 
                Questa è la pagina pubblica di prenotazione che invierai ai tuoi clienti. Prova a completare una prenotazione inserendo un nome e un numero di telefono fittizio. Se il servizio richiede la caparra, vedrai aprirsi la schermata protetta di Stripe Connect in cui inserire dati di test e procedere!
              </p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="relative">
            <div className="absolute -left-9.5 top-0 w-7 h-7 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center text-xs font-bold text-indigo-600 shadow-sm">
              4
            </div>
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Passo 4: Simula la ricezione degli SMS e le azioni</h4>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Subito dopo aver prenotato, sulla destra della schermata vedrai il <strong className="text-indigo-600 font-semibold">Simulatore di SMS</strong> in tempo reale. 
                Qui potrai vedere l'anteprima esatta del promemoria che arriverebbe sul telefono del cliente. Come cliente, puoi simulare di cliccare sul link cliccando sui pulsanti di azione in basso (<strong className="text-emerald-600 font-semibold">Conferma Presenza</strong> o <strong className="text-rose-600 font-semibold font-bold">Annulla Prenotazione</strong>).
              </p>
            </div>
          </div>

          {/* Step 5 */}
          <div className="relative">
            <div className="absolute -left-9.5 top-0 w-7 h-7 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center text-xs font-bold text-indigo-600 shadow-sm">
              5
            </div>
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Passo 5: Monitora i risultati e forzature in tempo reale</h4>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Torna al <strong className="text-slate-900 font-semibold">Pannello Titolare</strong>. Noterai che i grafici della <strong className="text-indigo-600 font-semibold">Dashboard Finanziaria</strong> si aggiornano istantaneamente. 
                Le caparre perse a causa di disdette tardive si convertono in "Entrate Protette da Penali". 
                Vai in <strong className="text-slate-900 font-semibold">Anagrafica Clienti</strong>: se noti che un cliente ha un punteggio di affidabilità compromesso (es. 40%), clicca su <strong className="text-rose-600 font-semibold font-bold">"Richiedi Caparra 100%"</strong> per obbligarlo a pagare il saldo intero al prossimo appuntamento!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Frequently Asked Questions */}
      <div className="glass-card p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider pb-3 border-b border-slate-100 flex items-center gap-2">
          <HelpCircle className="w-4.5 h-4.5 text-indigo-600" />
          Domande Frequenti (FAQ)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1.5 text-xs">
            <h5 className="font-bold text-indigo-700">La caparra è conforme al GDPR e alle norme bancarie?</h5>
            <p className="text-slate-500 leading-relaxed font-medium">
              Sì. Utilizzando Stripe Connect, l'inserimento della carta avviene su canali cifrati certificati PCI-DSS. Il salone non salva né vede mai i dettagli bancari dei clienti, tutelando al 100% la loro privacy.
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1.5 text-xs">
            <h5 className="font-bold text-indigo-700">Come funziona la Lista d'Attesa Automatica?</h5>
            <p className="text-slate-500 leading-relaxed font-medium">
              Quando un cliente disdice o cancella un appuntamento, NoShow Reducer controlla se ci sono clienti iscritti alla Lista d'Attesa per quel giorno o per quel servizio specifico, notificando immediatamente l'orario libero per riempirlo subito.
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1.5 text-xs">
            <h5 className="font-bold text-indigo-700">Cos'è il Punteggio di Affidabilità dei Clienti?</h5>
            <p className="text-slate-500 leading-relaxed font-medium">
              È una percentuale basata sulla puntualità passata (eseguiti vs. no-show). Più è alto, più il cliente è puntuale. Sotto l'80%, l'affidabilità scende, sbloccando la possibilità di richiedere la caparra obbligatoria per tutelare i tuoi orari più richiesti.
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1.5 text-xs">
            <h5 className="font-bold text-indigo-700">Posso personalizzare il messaggio del promemoria SMS?</h5>
            <p className="text-slate-500 leading-relaxed font-medium">
              Sì, interamente. Nella scheda Impostazioni trovi un editor di template con tag dinamici come <code className="text-indigo-700 font-mono">{"{NOME}"}</code>, <code className="text-indigo-700 font-mono">{"{SERVIZIO}"}</code> o <code className="text-indigo-700 font-mono">{"{LINK_CONFERMA}"}</code> che comporrà l'SMS in tempo reale per ogni cliente.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
