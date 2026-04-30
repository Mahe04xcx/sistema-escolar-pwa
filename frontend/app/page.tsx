'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { UserPlus, CalendarX, BarChart3, BrainCircuit } from 'lucide-react';

// Definimos la estructura del evento para que TypeScript no se queje
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function Home() {
  // Cambiamos 'any' por nuestro tipo personalizado o null
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      // Forzamos el tipo al recibir el evento
      const installEvent = e as BeforeInstallPromptEvent;
      installEvent.preventDefault();
      setDeferredPrompt(installEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const descargarPWA = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      alert("La aplicación ya está instalada o el navegador no ha detectado el Manifiesto aún.");
    }
  };

  const modulos = [
    { title: "Registro de Personal", path: "/registro", icon: <UserPlus size={40} />, color: "bg-[#800020]" },
    { title: "Inasistencias", path: "/inasistencias", icon: <CalendarX size={40} />, color: "bg-[#001F3F]" },
    { title: "Estadísticas", path: "/estadisticas", icon: <BarChart3 size={40} />, color: "bg-[#800020]" },
    { title: "Análisis IA", path: "/ia-analisis", icon: <BrainCircuit size={40} />, color: "bg-[#001F3F]" }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 font-sans">
      <header className="w-full bg-white border-b-8 border-[#800020] py-10 px-16 shadow-sm">
        <h1 className="text-3xl font-bold text-[#001F3F] tracking-tight">
          SISTEMA DE CONTROL ESCOLAR
        </h1>
        <p className="text-[#800020] font-medium uppercase tracking-widest text-sm">
          Panel de Gestión Administrativa
        </p>
      </header>

      <main className="flex-1 max-w-6xl mx-auto py-16 px-8 sm:px-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {modulos.map((m, i) => (
            <Link key={i} href={m.path} className="group">
              <div className={`${m.color} p-10 rounded-2xl text-white shadow-xl hover:scale-105 transition-all duration-300 flex flex-col items-center text-center h-full justify-center`}>
                <div className="mb-4 bg-white/10 p-4 rounded-full group-hover:bg-white/20">
                  {m.icon}
                </div>
                <h2 className="text-xl font-bold leading-6">{m.title}</h2>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-20 flex flex-col gap-6 items-center sm:items-start">
          <h3 className="text-xl font-semibold text-black italic">
            Acceso rápido al sistema
          </h3>
          <p className="max-w-md text-zinc-600">
            Selecciona un módulo para comenzar. El sistema guarda los cambios automáticamente en la base de datos local.
          </p>
          
          <button 
            onClick={descargarPWA}
            className="h-12 px-8 rounded-full bg-[#001F3F] text-white font-medium hover:bg-[#800020] transition-colors shadow-lg"
          >
            Descargar como App (PWA)
          </button>
        </div>
      </main>
    </div>
  );
}