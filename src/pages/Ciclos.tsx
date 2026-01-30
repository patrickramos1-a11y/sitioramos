import { AppLayout } from "@/components/layout/AppLayout";
import { RefreshCw, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Ciclos = () => {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Ciclos Produtivos</h1>
            <p className="text-muted-foreground">Gerencie os ciclos de produção</p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Ciclo
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Seus Ciclos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Nenhum ciclo cadastrado ainda.</p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Ciclos;
