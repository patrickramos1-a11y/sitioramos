import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Areas from "./pages/Areas";
import AreaDetalhe from "./pages/AreaDetalhe";
import TalhaoDetalhe from "./pages/TalhaoDetalhe";
import Emprestimos from "./pages/Emprestimos";
import Caixa from "./pages/Caixa";
import Propriedade from "./pages/Propriedade";
import Operacao from "./pages/Operacao";
import Contatos from "./pages/Contatos";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
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
            <Route path="/contatos" element={<Contatos />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
