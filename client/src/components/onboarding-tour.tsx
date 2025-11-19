import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { createPortal } from "react-dom";
import { useToast } from "@/hooks/use-toast";

export interface TourStep {
  target: string;
  title: string;
  content: string;
  placement?: "top" | "bottom" | "left" | "right";
}

interface OnboardingTourProps {
  steps: TourStep[];
  isActive: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

export function OnboardingTour({ steps, isActive, onComplete, onSkip }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [highlightPosition, setHighlightPosition] = useState({ top: 0, left: 0, width: 0, height: 0 });
  const [elementFound, setElementFound] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const retryCountRef = useRef(0);
  const { toast } = useToast();

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;
  const maxRetries = 20;

  useEffect(() => {
    if (!isActive || !currentStepData) return;

    setElementFound(false);
    retryCountRef.current = 0;

    const tryFindElement = () => {
      const targetElement = document.querySelector(currentStepData.target);
      
      if (!targetElement) {
        retryCountRef.current += 1;
        
        if (retryCountRef.current < maxRetries) {
          setTimeout(tryFindElement, 200);
        } else {
          toast({
            title: "Elemento não encontrado",
            description: "Não foi possível encontrar o elemento para este passo. Certifique-se de que existem dados cadastrados.",
            variant: "destructive",
          });
          onSkip();
        }
        return;
      }

      setElementFound(true);
      updatePosition(targetElement);
    };

    const updatePosition = (targetElement: Element) => {
      const rect = targetElement.getBoundingClientRect();
      const scrollTop = window.scrollY;
      const scrollLeft = window.scrollX;

      setHighlightPosition({
        top: rect.top + scrollTop,
        left: rect.left + scrollLeft,
        width: rect.width,
        height: rect.height,
      });

      const isMobile = window.innerWidth < 640;
      const tooltipWidth = isMobile ? Math.min(280, window.innerWidth - 32) : 320;
      const tooltipHeight = 200;
      const gap = isMobile ? 8 : 16;

      let top = 0;
      let left = 0;

      const placement = currentStepData.placement || "bottom";

      switch (placement) {
        case "top":
          top = rect.top + scrollTop - tooltipHeight - gap;
          left = rect.left + scrollLeft + rect.width / 2 - tooltipWidth / 2;
          break;
        case "bottom":
          top = rect.top + scrollTop + rect.height + gap;
          left = rect.left + scrollLeft + rect.width / 2 - tooltipWidth / 2;
          break;
        case "left":
          if (isMobile) {
            top = rect.top + scrollTop + rect.height + gap;
            left = rect.left + scrollLeft + rect.width / 2 - tooltipWidth / 2;
          } else {
            top = rect.top + scrollTop + rect.height / 2 - tooltipHeight / 2;
            left = rect.left + scrollLeft - tooltipWidth - gap;
          }
          break;
        case "right":
          if (isMobile) {
            top = rect.top + scrollTop + rect.height + gap;
            left = rect.left + scrollLeft + rect.width / 2 - tooltipWidth / 2;
          } else {
            top = rect.top + scrollTop + rect.height / 2 - tooltipHeight / 2;
            left = rect.left + scrollLeft + rect.width + gap;
          }
          break;
      }

      left = Math.max(16, Math.min(left, window.innerWidth - tooltipWidth - 16));
      top = Math.max(16, top);

      setTooltipPosition({ top, left });

      targetElement.scrollIntoView({ behavior: "smooth", block: "center" });
    };

    const handleResize = () => {
      const targetElement = document.querySelector(currentStepData.target);
      if (targetElement) {
        updatePosition(targetElement);
      }
    };

    tryFindElement();

    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleResize);
    };
  }, [currentStep, currentStepData, isActive, onSkip, toast]);

  if (!isActive || !currentStepData || !elementFound) return null;

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      setCurrentStep(currentStep - 1);
    }
  };

  return createPortal(
    <>
      <div 
        className="fixed inset-0 bg-black/50 z-[9998]"
        style={{ pointerEvents: "auto" }}
      />

      <div
        className="fixed z-[9999] rounded-lg ring-4 ring-primary ring-offset-4 ring-offset-background"
        style={{
          top: highlightPosition.top,
          left: highlightPosition.left,
          width: highlightPosition.width,
          height: highlightPosition.height,
          pointerEvents: "none",
        }}
      />

      <Card
        ref={tooltipRef}
        className="fixed z-[10000] w-[calc(100vw-2rem)] max-w-[280px] sm:max-w-[320px] shadow-2xl"
        style={{
          top: tooltipPosition.top,
          left: tooltipPosition.left,
        }}
        data-testid="tour-tooltip"
      >
        <CardHeader className="pb-2 sm:pb-3">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-sm sm:text-base">{currentStepData.title}</CardTitle>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={onSkip}
              data-testid="button-tour-skip"
            >
              <X className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pb-2 sm:pb-3">
          <p className="text-xs sm:text-sm text-muted-foreground">{currentStepData.content}</p>
        </CardContent>
        <CardFooter className="flex items-center justify-between gap-2 pt-2 sm:pt-3 border-t">
          <div className="text-xs text-muted-foreground">
            {currentStep + 1} de {steps.length}
          </div>
          <div className="flex gap-1 sm:gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevious}
              disabled={isFirstStep}
              data-testid="button-tour-previous"
              className="h-8 px-2 sm:px-3"
            >
              <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
              <span className="hidden sm:inline">Anterior</span>
            </Button>
            <Button
              size="sm"
              onClick={handleNext}
              data-testid="button-tour-next"
              className="h-8 px-2 sm:px-3"
            >
              <span className="text-xs sm:text-sm">{isLastStep ? "Concluir" : "Próximo"}</span>
              {!isLastStep && <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 sm:ml-1" />}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </>,
    document.body
  );
}
