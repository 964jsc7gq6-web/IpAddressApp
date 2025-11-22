import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, CreditCard, Home, Building2 } from "lucide-react";
import { OnboardingTour, type TourStep } from "./onboarding-tour";
import { useLocation } from "wouter";

type PaymentType = "parcela" | "aluguel" | "condominio";

const tourSteps: Record<PaymentType, TourStep[]> = {
  parcela: [
    {
      target: '[data-testid="button-add-parcela"]',
      title: "Adicionar Parcela",
      content: "Clique aqui para adicionar uma nova parcela do financiamento. Você pode definir número, valor e vencimento.",
      placement: "bottom",
    },
    {
      target: '[data-testid^="card-parcela-"]',
      title: "Visualizar Parcela",
      content: "Aqui você vê os detalhes de cada parcela: número, valor, vencimento e status de pagamento.",
      placement: "right",
    },
    {
      target: '[data-testid^="status-control-parcela-"]',
      title: "Controlar Pagamento",
      content: "Use este controle para marcar a parcela como Pendente, Paga (com comprovante) ou Recusada.",
      placement: "left",
    },
    {
      target: '[data-testid^="button-upload-comprovante-"]',
      title: "Enviar Comprovante",
      content: "Após marcar como Paga, você pode fazer upload do comprovante de pagamento aqui.",
      placement: "top",
    },
  ],
  aluguel: [
    {
      target: '[data-testid="button-add-aluguel"]',
      title: "Adicionar Aluguel",
      content: "Clique aqui para adicionar um novo registro de aluguel mensal.",
      placement: "bottom",
    },
    {
      target: '[data-testid^="card-aluguel-"]',
      title: "Visualizar Aluguel",
      content: "Cada card mostra os detalhes do aluguel do mês: mês/ano, valor e status.",
      placement: "right",
    },
    {
      target: '[data-testid^="status-control-aluguel-"]',
      title: "Controlar Pagamento",
      content: "Gerencie o status do aluguel: Pendente, Pago (com comprovante) ou Recusado.",
      placement: "left",
    },
    {
      target: '[data-testid^="button-upload-comprovante-"]',
      title: "Anexar Comprovante",
      content: "Anexe o comprovante de pagamento do aluguel após marcá-lo como Pago.",
      placement: "top",
    },
  ],
  condominio: [
    {
      target: '[data-testid="button-add-condominio"]',
      title: "Adicionar Condomínio",
      content: "Clique aqui para registrar uma nova taxa de condomínio mensal.",
      placement: "bottom",
    },
    {
      target: '[data-testid^="card-condominio-"]',
      title: "Visualizar Condomínio",
      content: "Veja os detalhes da taxa de condomínio: mês/ano, valor e status de pagamento.",
      placement: "right",
    },
    {
      target: '[data-testid^="status-control-condominio-"]',
      title: "Gerenciar Status",
      content: "Controle o status da taxa: Pendente, Paga (requer comprovante) ou Recusada.",
      placement: "left",
    },
    {
      target: '[data-testid^="button-upload-comprovante-"]',
      title: "Comprovante de Pagamento",
      content: "Faça upload do comprovante após marcar a taxa como Paga.",
      placement: "top",
    },
  ],
};

const paymentTypeRoutes: Record<PaymentType, string> = {
  parcela: "/parcelas",
  aluguel: "/alugueis",
  condominio: "/condominios",
};

const paymentTypeLabels: Record<PaymentType, { title: string; description: string; icon: typeof CreditCard }> = {
  parcela: {
    title: "Parcelas",
    description: "Aprenda a gerenciar as parcelas do financiamento",
    icon: CreditCard,
  },
  aluguel: {
    title: "Aluguéis",
    description: "Entenda como controlar os pagamentos de aluguel",
    icon: Home,
  },
  condominio: {
    title: "Condomínios",
    description: "Veja como registrar as taxas de condomínio",
    icon: Building2,
  },
};

export function OnboardingAssistant() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tourActive, setTourActive] = useState(false);
  const [selectedType, setSelectedType] = useState<PaymentType | null>(null);
  const [tooltipOpen, setTooltipOpen] = useState(true);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const timer = setTimeout(() => {
      setTooltipOpen(false);
    }, 8000);
    return () => clearTimeout(timer);
  }, []);

  const handleSelectType = (type: PaymentType) => {
    setSelectedType(type);
    setDialogOpen(false);
    setLocation(paymentTypeRoutes[type]);
    
    setTimeout(() => {
      setTourActive(true);
    }, 1000);
  };

  const handleTourComplete = () => {
    setTourActive(false);
    setSelectedType(null);
  };

  const handleTourSkip = () => {
    setTourActive(false);
    setSelectedType(null);
  };

  return (
    <>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <TooltipProvider delayDuration={0}>
          <Tooltip open={tooltipOpen} onOpenChange={setTooltipOpen}>
            <TooltipTrigger asChild>
              <DialogTrigger asChild>
                <Button
                  variant="default"
                  size="default"
                  className="gap-1 sm:gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white border-0 px-3 sm:px-4 assistant-glow assistant-pulse-intense"
                  data-testid="button-assistant"
                >
                  <Sparkles className="h-4 w-4 animate-pulse shrink-0" />
                  <span className="font-medium text-sm sm:text-base">Assistente IA</span>
                </Button>
              </DialogTrigger>
            </TooltipTrigger>
            <TooltipContent 
              side="bottom" 
              className="bg-violet-950/95 text-white border-0 no-shadow"
              data-testid="tooltip-assistant"
            >
              <p className="text-sm font-medium">Aprenda a usar o app com nosso assistente guiado!</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        </Dialog>
        <DialogContent className="max-w-[95vw] sm:max-w-md" data-testid="dialog-assistant">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Assistente de Uso</DialogTitle>
            <DialogDescription className="text-sm">
              Escolha qual tipo de pagamento você quer aprender a gerenciar
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:gap-4 py-3 sm:py-4">
            {(Object.entries(paymentTypeLabels) as [PaymentType, typeof paymentTypeLabels[PaymentType]][]).map(
              ([type, { title, description, icon: Icon }]) => (
                <Card
                  key={type}
                  className="cursor-pointer hover-elevate active-elevate-2"
                  onClick={() => handleSelectType(type)}
                  data-testid={`card-tour-${type}`}
                >
                  <CardHeader className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-base">{title}</CardTitle>
                        <CardDescription className="text-sm mt-1">
                          {description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              )
            )}
          </div>
        </DialogContent>

      {tourActive && selectedType && (
        <OnboardingTour
          steps={tourSteps[selectedType]}
          isActive={tourActive}
          onComplete={handleTourComplete}
          onSkip={handleTourSkip}
        />
      )}
    </>
  );
}
