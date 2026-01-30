import { AppLayout } from "@/components/layout/AppLayout";
import { FileText, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Investimentos = () => {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Investimentos</h1>
            <p className="text-muted-foreground">Gerencie investimentos e legalização</p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Investimento
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Seus Investimentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Nenhum investimento registrado ainda.</p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Investimentos;
