import { AppLayout } from "@/components/layout/AppLayout";
import { TrendingUp, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Receitas = () => {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Receitas</h1>
            <p className="text-muted-foreground">Registre suas vendas e receitas</p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Receita
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Suas Receitas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Nenhuma receita registrada ainda.</p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Receitas;
