import { AppLayout } from "@/components/layout/AppLayout";
import { Landmark, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Emprestimos = () => {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Empréstimos</h1>
            <p className="text-muted-foreground">Controle seus empréstimos e parcelas</p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Empréstimo
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Landmark className="h-5 w-5" />
              Seus Empréstimos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Nenhum empréstimo registrado ainda.</p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Emprestimos;
