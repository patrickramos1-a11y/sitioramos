import { AppLayout } from "@/components/layout/AppLayout";
import { DollarSign, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Custos = () => {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Custos</h1>
            <p className="text-muted-foreground">Registre e acompanhe seus custos</p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Custo
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Seus Custos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Nenhum custo registrado ainda.</p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Custos;
