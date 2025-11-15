import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Condominio } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PaymentStatusControl } from "@/components/payment-status-control";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Calendar, DollarSign, CheckCircle2, XCircle, Building } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export default function Condominios() {
  const { isProprietario } = useAuth();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: condominios, isLoading } = useQuery<Condominio[]>({
    queryKey: ["/api/condominios"],
  });

  const formSchema = z.object({
    valor: z.number().positive("Valor deve ser positivo"),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      valor: 0,
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: { valor: number }) => {
      return apiRequest("POST", "/api/condominios", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/condominios"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Condomínio criado com sucesso" });
      setDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar condomínio",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      status,
      comprovante,
    }: {
      id: number;
      status: string;
      comprovante?: File;
    }) => {
      const formData = new FormData();
      formData.append("status", status);
      if (comprovante) {
        formData.append("comprovante", comprovante);
      }
      return apiRequest("PATCH", `/api/condominios/${id}`, formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/condominios"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Condomínio atualizado com sucesso" });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar condomínio",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    createMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Condomínio</h1>
          <p className="text-muted-foreground">Controle mensal de taxas de condomínio</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setDialogOpen(true)} data-testid="button-new-condominio">
              <Plus className="w-4 h-4 mr-2" />
              Novo Condomínio
            </Button>
          </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Novo Condomínio</DialogTitle>
                <DialogDescription>
                  Mês e ano serão gerados automaticamente. Informe o valor.
                </DialogDescription>
              </DialogHeader>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="valor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor (R$) *</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            data-testid="input-valor"
                          />
                        </FormControl>
                        <FormDescription>
                          Valor pode variar mês a mês
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setDialogOpen(false)}
                      data-testid="button-cancel"
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={createMutation.isPending}
                      data-testid="button-save"
                    >
                      {createMutation.isPending ? "Criando..." : "Criar Condomínio"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
      </div>

      <div className="bg-muted/50 rounded-lg p-4">
        <p className="text-sm text-muted-foreground">
          <strong>Nota:</strong> Mês e ano são incrementados automaticamente.
          O valor pode ser diferente a cada mês.
        </p>
      </div>

      {!condominios || condominios.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Building className="w-16 h-16 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">Nenhum condomínio cadastrado</p>
            <p className="text-sm text-muted-foreground mb-6">
              Comece adicionando registros de condomínio
            </p>
            <Button onClick={() => setDialogOpen(true)} data-testid="button-new-condominio-empty">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Primeiro Condomínio
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {condominios.map((condominio) => (
            <Card
              key={condominio.id}
              className={condominio.status === 'pago' ? "border-primary/30" : ""}
              data-testid={`card-condominio-${condominio.id}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">
                    {MESES[condominio.mes - 1]} / {condominio.ano}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Período</span>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium" data-testid={`text-periodo-${condominio.id}`}>
                      {condominio.mes}/{condominio.ano}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Valor</span>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    <span className="text-lg font-mono font-bold" data-testid={`text-valor-${condominio.id}`}>
                      R$ {parseFloat(condominio.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {condominio.pago_em && (
                  <div className="text-xs text-muted-foreground pt-2 border-t">
                    Pago em: {new Date(condominio.pago_em).toLocaleDateString("pt-BR")}
                  </div>
                )}

                <div className="pt-3 border-t">
                  <PaymentStatusControl
                    recordId={condominio.id}
                    currentStatus={condominio.status}
                    onStatusChange={(newStatus, comprovante) => {
                      updateMutation.mutate({
                        id: condominio.id,
                        status: newStatus,
                        comprovante,
                      });
                    }}
                    isLoading={updateMutation.isPending}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
