import { AppLayout } from "@/components/layout/AppLayout";
import { MapPin, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Areas = () => {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Áreas</h1>
            <p className="text-muted-foreground">Gerencie suas áreas de cultivo</p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Área
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Suas Áreas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Nenhuma área cadastrada ainda.</p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Areas;
