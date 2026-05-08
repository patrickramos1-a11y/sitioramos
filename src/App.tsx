import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { idbPersister } from "@/lib/queryPersist";
import { startVersionCheck } from "@/lib/versionCheck";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Areas from "./pages/Areas";
import AreaDetalhe from "./pages/AreaDetalhe";
import TalhaoDetalhe from "./pages/TalhaoDetalhe";
import Emprestimos from "./pages/Emprestimos";
import Caixa from "./pages/Caixa";
import Propriedade from "./pages/Propriedade";
import Operacao from "./pages/Operacao";
import ProjetoDetalhe from "./pages/ProjetoDetalhe";
import Lancamentos from "./pages/Lancamentos";
import Contatos from "./pages/Contatos";
import Responsaveis from "./pages/Responsaveis";
import Diario from "./pages/Diario";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      gcTime: 1000 * 60 * 60 * 24 * 7,
      networkMode: "offlineFirst",
      refetchOnReconnect: true,
      retry: (failureCount) => (navigator.onLine ? failureCount < 2 : false),
    },
    mutations: { networkMode: "offlineFirst" },
  },
});

const App = () => {
  useEffect(() => {
    startVersionCheck();
  }, []);
  return (
  <PersistQueryClientProvider
    client={queryClient}
    persistOptions={{
      persister: idbPersister,
      maxAge: 1000 * 60 * 60 * 24 * 7,
      buster: "v1",
    }}
  >
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<Index />} />
            <Route path="/propriedade" element={<Propriedade />} />
            <Route path="/caixa" element={<Caixa />} />
            <Route path="/areas" element={<Areas />} />
            <Route path="/areas/:id" element={<AreaDetalhe />} />
            <Route path="/talhoes/:id" element={<TalhaoDetalhe />} />
            <Route path="/emprestimos" element={<Emprestimos />} />
            <Route path="/operacao" element={<Operacao />} />
            <Route path="/operacao/projetos/:id" element={<ProjetoDetalhe />} />
            <Route path="/operacao/subprojetos/:id" element={<ProjetoDetalhe />} />
            <Route path="/lancamentos" element={<Lancamentos />} />
            <Route path="/contatos" element={<Contatos />} />
            <Route path="/responsaveis" element={<Responsaveis />} />
            <Route path="/diario" element={<Diario />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </PersistQueryClientProvider>
  );
};

export default App;
