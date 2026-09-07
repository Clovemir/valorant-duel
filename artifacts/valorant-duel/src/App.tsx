import { useEffect, useRef } from "react";
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import { Switch, Route, useLocation, Router as WouterRouter, Link } from 'wouter';
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/toaster';

import { LandingView } from './views/LandingView';
import { DashboardView } from './views/DashboardView';
import { TournamentCreateView } from './views/TournamentCreateView';
import { TournamentDetailView } from './views/TournamentDetailView';
import { TournamentManageView } from './views/TournamentManageView';

const queryClient = new QueryClient();

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in .env file');
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "hsl(350, 100%, 64%)",
    colorForeground: "hsl(40, 21%, 95%)",
    colorMutedForeground: "hsl(225, 10%, 65%)",
    colorDanger: "hsl(0, 84%, 60%)",
    colorBackground: "hsl(225, 14%, 7%)",
    colorInput: "hsl(225, 14%, 11%)",
    colorInputForeground: "hsl(40, 21%, 95%)",
    colorNeutral: "hsl(225, 14%, 20%)",
    fontFamily: "'Inter', sans-serif",
    borderRadius: "0px",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-card border-border border val-clip-tl w-[440px] max-w-full overflow-hidden rounded-none p-6",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "font-display uppercase tracking-widest text-2xl text-foreground",
    headerSubtitle: "text-muted-foreground",
    socialButtonsBlockButtonText: "font-display uppercase tracking-wider text-sm",
    formFieldLabel: "font-display uppercase text-xs tracking-wider text-muted-foreground",
    footerActionLink: "text-primary hover:text-primary/80 font-display uppercase tracking-wider text-xs",
    footerActionText: "text-muted-foreground font-display uppercase text-xs",
    dividerText: "text-muted-foreground font-display uppercase text-xs tracking-wider",
    identityPreviewEditButton: "text-primary hover:text-primary/80",
    formFieldSuccessText: "text-primary",
    alertText: "text-destructive",
    logoBox: "mb-4",
    logoImage: "h-12 w-auto",
    socialButtonsBlockButton: "border border-border hover:bg-muted text-foreground !rounded-none",
    formButtonPrimary: "bg-primary text-primary-foreground hover:bg-primary/90 font-display uppercase tracking-widest !rounded-none val-clip-br",
    formFieldInput: "bg-background border-border text-foreground focus:border-primary !rounded-none",
    footerAction: "mt-6",
    dividerLine: "bg-border",
    alert: "bg-destructive/10 border-destructive/20 border text-destructive",
    otpCodeFieldInput: "bg-background border-border text-foreground !rounded-none",
    formFieldRow: "mb-4",
    main: "w-full",
  },
};

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
    </div>
  );
}

function Header() {
  const { signOut } = useClerk();
  
  return (
    <header className="bg-background/90 backdrop-blur-md border-b border-border/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 md:h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 md:gap-4 group shrink-0">
           <div className="relative w-6 h-6 md:w-8 md:h-8 bg-primary val-clip-tl group-hover:bg-accent transition-colors shrink-0">
             <div className="absolute inset-1 border border-background/20 val-clip-tl"></div>
           </div>
           <h1 className="font-display text-base sm:text-xl md:text-3xl uppercase tracking-widest md:tracking-[0.2em] text-foreground mt-1 whitespace-nowrap">
             HUB TÁTICO <span className="text-primary group-hover:text-accent transition-colors hidden sm:inline">//</span>
           </h1>
        </Link>
        <div className="flex items-center gap-3 md:gap-6 shrink-0">
          <Show when="signed-out">
            <Link href="/sign-in" className="font-display uppercase text-[10px] md:text-sm tracking-widest hover:text-primary transition-colors">
              <span className="sm:hidden">Entrar (Org)</span>
              <span className="hidden sm:inline">Entrar como Organizador</span>
            </Link>
            <Link href="/sign-up" className="bg-primary hover:bg-primary/90 text-primary-foreground px-3 py-2 md:px-6 md:py-3 font-display uppercase text-[10px] md:text-sm tracking-widest val-clip-br transition-all">
              Criar Torneio
            </Link>
          </Show>
          <Show when="signed-in">
             <Link href="/tournaments/new" className="font-display uppercase text-[10px] md:text-sm tracking-widest text-muted-foreground hover:text-foreground transition-colors hidden md:block">
               Nova Operação
             </Link>
             <button
               onClick={() => signOut({ redirectUrl: basePath || "/" })}
               className="font-display uppercase text-[10px] md:text-sm tracking-widest text-muted-foreground hover:text-destructive transition-colors border border-border hover:border-destructive/50 px-3 py-1.5 md:px-6 md:py-2.5 val-clip-tl"
             >
               <span className="sm:hidden">Sair</span>
               <span className="hidden sm:inline">Desconectar</span>
             </button>
          </Show>
        </div>
      </div>
    </header>
  );
}

function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground relative">
      <div className="bg-noise" />
      <Header />
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-10 md:py-16 animate-in fade-in duration-300 relative z-10">
        {children}
      </main>
    </div>
  );
}

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in">
        <DashboardView />
      </Show>
      <Show when="signed-out">
        <LandingView />
      </Show>
    </>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const queryClient = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (
        prevUserIdRef.current !== undefined &&
        prevUserIdRef.current !== userId
      ) {
        queryClient.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, queryClient]);

  return null;
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: {
          start: {
            title: "Portal do Organizador",
            subtitle: "Entre para gerenciar seus torneios",
          },
        },
        signUp: {
          start: {
            title: "Criar Conta de Organizador",
            subtitle: "Inicie seu hub de torneios hoje",
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <TooltipProvider>
          <Switch>
            <Route path="/sign-in/*?" component={SignInPage} />
            <Route path="/sign-up/*?" component={SignUpPage} />
            
            <Route path="/">
              <MainLayout><HomeRedirect /></MainLayout>
            </Route>
            <Route path="/tournaments/new">
              <MainLayout>
                <Show when="signed-in"><TournamentCreateView /></Show>
                <Show when="signed-out"><DashboardView /></Show>
              </MainLayout>
            </Route>
            <Route path="/t/:slug">
              <MainLayout><TournamentDetailView /></MainLayout>
            </Route>
            <Route path="/t/:slug/manage">
              <MainLayout>
                <Show when="signed-in"><TournamentManageView /></Show>
                <Show when="signed-out"><DashboardView /></Show>
              </MainLayout>
            </Route>
            <Route>
              <MainLayout>
                <div className="text-center py-20">
                  <h2 className="font-display text-4xl text-muted-foreground">Página não encontrada</h2>
                </div>
              </MainLayout>
            </Route>
          </Switch>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

export default function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}
