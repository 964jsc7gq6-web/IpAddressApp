import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/use-auth";

interface PaymentStatusToggleProps {
  recordId: number;
  isPaid: boolean;
  onToggle: (checked: boolean) => void;
  isLoading?: boolean;
}

export function PaymentStatusToggle({
  recordId,
  isPaid,
  onToggle,
  isLoading = false,
}: PaymentStatusToggleProps) {
  const { canManagePayments } = useAuth();

  if (!canManagePayments) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <Checkbox
        checked={!!isPaid}
        onCheckedChange={(checked) => onToggle(Boolean(checked))}
        disabled={isLoading}
        data-testid={`checkbox-pago-${recordId}`}
      />
      <span className="text-sm">Marcar como {isPaid ? "pendente" : "pago"}</span>
    </div>
  );
}
