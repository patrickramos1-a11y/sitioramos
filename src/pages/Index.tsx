import { AppLayout } from "@/components/layout/AppLayout";
import Dashboard from "./Dashboard";
import { MobileHome } from "@/components/home/MobileHome";
import { useIsMobile } from "@/hooks/use-mobile";

const Index = () => {
  const isMobile = useIsMobile();
  return (
    <AppLayout>
      {isMobile ? <MobileHome /> : <Dashboard />}
    </AppLayout>
  );
};

export default Index;
