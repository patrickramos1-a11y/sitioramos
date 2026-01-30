import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
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
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/areas" element={<ProtectedRoute><Areas /></ProtectedRoute>} />
            <Route path="/ciclos" element={<ProtectedRoute><Ciclos /></ProtectedRoute>} />
            <Route path="/custos" element={<ProtectedRoute><Custos /></ProtectedRoute>} />
            <Route path="/investimentos" element={<ProtectedRoute><Investimentos /></ProtectedRoute>} />
            <Route path="/receitas" element={<ProtectedRoute><Receitas /></ProtectedRoute>} />
            <Route path="/emprestimos" element={<ProtectedRoute><Emprestimos /></ProtectedRoute>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
