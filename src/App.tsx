import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Areas from "./pages/Areas";
import Ciclos from "./pages/Ciclos";
import Custos from "./pages/Custos";
import Investimentos from "./pages/Investimentos";
import Receitas from "./pages/Receitas";
import Emprestimos from "./pages/Emprestimos";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/areas" element={<Areas />} />
          <Route path="/ciclos" element={<Ciclos />} />
          <Route path="/custos" element={<Custos />} />
          <Route path="/investimentos" element={<Investimentos />} />
          <Route path="/receitas" element={<Receitas />} />
          <Route path="/emprestimos" element={<Emprestimos />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
