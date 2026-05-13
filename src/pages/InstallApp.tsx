import { useEffect, useState } from "react";
import { Download, CheckCircle2, Smartphone, Share2 } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  ("standalone" in window.navigator && Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone));

const InstallApp = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    setInstalled(isStandalone());
    setIsIos(/iphone|ipad|ipod/i.test(window.navigator.userAgent));

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const onInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") setInstalled(true);
    setDeferredPrompt(null);
  };

  return (
    <main className="min-h-screen bg-background text-foreground px-4 py-8 flex items-center justify-center">
      <section className="w-full max-w-lg border border-border bg-card rounded-lg overflow-hidden">
        <div className="p-6 border-b border-border bg-secondary/60">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-md bg-primary text-primary-foreground flex items-center justify-center">
              <Smartphone className="w-7 h-7" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold uppercase tracking-wide">Install BETKING</h1>
              <p className="text-sm text-muted-foreground">Add BETKING to your phone home screen.</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {installed ? (
            <div className="flex items-center gap-3 rounded-md border border-primary/40 bg-primary/10 p-4 text-sm">
              <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
              <span>BETKING is already installed on this device.</span>
            </div>
          ) : deferredPrompt ? (
            <button
              onClick={handleInstall}
              className="w-full bg-primary text-primary-foreground py-3 rounded-md font-display font-bold text-sm uppercase tracking-wider hover:brightness-110 transition glow-green flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Install App
            </button>
          ) : isIos ? (
            <div className="space-y-3 text-sm text-muted-foreground">
              <p className="flex items-center gap-2 text-foreground font-semibold">
                <Share2 className="w-4 h-4 text-primary" />
                iPhone install steps
              </p>
              <ol className="list-decimal list-inside space-y-2">
                <li>Open this page in Safari.</li>
                <li>Tap Share.</li>
                <li>Choose Add to Home Screen.</li>
              </ol>
            </div>
          ) : (
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>Open your browser menu and choose Install app or Add to Home screen.</p>
              <p>If the button is not available yet, reload this page after the latest version is published.</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
            <div className="rounded-md border border-border bg-secondary p-3">Fast launch from your home screen</div>
            <div className="rounded-md border border-border bg-secondary p-3">Full-screen app experience</div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default InstallApp;
