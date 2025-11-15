import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertParcelaSchema, type Parcela, type InsertParcela } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PaymentStatusToggle } from "@/components/payment-status-toggle";
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
import { Plus, Calendar, DollarSign, CheckCircle2, XCircle, FileText } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { FileUpload } from "@/components/file-upload";
import { z } from "zod";

export default function Parcelas() {
  const { isProprietario } = useAuth();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [comprovanteFile, setComprovanteFile] = useState<File[]>([]);

  const { data: parcelas, isLoading } = useQuery<Parcela[]>({
    queryKey: ["/api/parcelas"],
  });

  const formSchema = insertParcelaSchema;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      valor: 0,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      return apiRequest("POST", "/api/parcelas", formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/parcelas"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Parcela criada com sucesso" });
      setDialogOpen(false);
      form.reset();
      setComprovanteFile([]);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar parcela",
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
      return apiRequest("PATCH", `/api/parcelas/${id}`, formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/parcelas"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Parcela atualizada com sucesso" });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar parcela",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    const formData = new FormData();
    formData.append("valor", data.valor.toString());
    if (comprovanteFile[0]) {
      formData.append("comprovante", comprovanteFile[0]);
    }
    createMutation.mutate(formData);
  };

  const togglePago = (parcela: Parcela, checked: boolean, comprovante?: File) => {
    const newStatus = checked ? 'pago' : 'pendente';
    if (newStatus === parcela.status) return;
    updateMutation.mutate({
      id: parcela.id,
      status: newStatus,
      comprovante,
    });
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
          <h1 className="text-2xl font-bold">Parcelas</h1>
          <p className="text-muted-foreground">Controle de parcelas da venda do imóvel</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setDialogOpen(true)} data-testid="button-new-parcela">
              <Plus className="w-4 h-4 mr-2" />
              Nova Parcela
            </Button>
          </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Nova Parcela</DialogTitle>
                <DialogDescription>
                  O número e vencimento serão gerados automaticamente
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
                          Valor pode ser editado após criação
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FileUpload
                    maxFiles={1}
                    maxSizeMB={2}
                    accept={["pdf", "jpg", "jpeg", "png"]}
                    onFilesChange={setComprovanteFile}
                    label="Comprovante (opcional)"
                    hint="PDF ou imagem, máx 2MB"
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
                      {createMutation.isPending ? "Criando..." : "Criar Parcela"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
      </div>

      {!parcelas || parcelas.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="w-16 h-16 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">Nenhuma parcela cadastrada</p>
            <p className="text-sm text-muted-foreground mb-6">
              Comece adicionando parcelas da venda do imóvel
            </p>
            <Button onClick={() => setDialogOpen(true)} data-testid="button-new-parcela-empty">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Primeira Parcela
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {parcelas.map((parcela) => (
            <Card
              key={parcela.id}
              className={parcela.status === 'pago' ? "border-primary/30" : ""}
              data-testid={`card-parcela-${parcela.id}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">
                    Parcela #{parcela.numero}
                  </CardTitle>
                  <Badge
                    variant={parcela.status === 'pago' ? "default" : parcela.status === 'pagamento_informado' ? "secondary" : "destructive"}
                    className="flex items-center gap-1"
                    data-testid={`badge-status-${parcela.id}`}
                  >
                    {parcela.status === 'pago' ? (
                      <>
                        <CheckCircle2 className="w-3 h-3" />
                        Paga
                      </>
                    ) : parcela.status === 'pagamento_informado' ? (
                      <>
                        <CheckCircle2 className="w-3 h-3" />
                        Pagamento Informado
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3" />
                        Pendente
                      </>
                    )}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Vencimento</span>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium" data-testid={`text-vencimento-${parcela.id}`}>
                      {new Date(parcela.vencimento).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Valor</span>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    <span className="text-lg font-mono font-bold" data-testid={`text-valor-${parcela.id}`}>
                      R$ {parseFloat(parcela.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {parcela.pago_em && (
                  <div className="text-xs text-muted-foreground pt-2 border-t">
                    Pago em: {new Date(parcela.pago_em).toLocaleDateString("pt-BR")}
                  </div>
                )}

                <div className="pt-3 border-t">
                  <PaymentStatusToggle
                    recordId={parcela.id}
                    isPaid={parcela.status === 'pago'}
                    onToggle={(checked) => togglePago(parcela, checked)}
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
