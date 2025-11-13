import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertImovelSchema, type Imovel, type InsertImovel } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
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
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Building2, MapPin, DollarSign, Pencil, FileText, Image as ImageIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { FileUpload } from "@/components/file-upload";

export default function Imovel() {
  const { isProprietario } = useAuth();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [contratoFile, setContratoFile] = useState<File[]>([]);
  const [fotoCapaFile, setFotoCapaFile] = useState<File[]>([]);
  const [anexosFiles, setAnexosFiles] = useState<File[]>([]);

  const { data: imovel, isLoading } = useQuery<Imovel | null>({
    queryKey: ["/api/imovel"],
  });

  const form = useForm<InsertImovel>({
    resolver: zodResolver(insertImovelSchema),
    defaultValues: {
      nome: "",
      endereco: "",
      valor_imovel: 0,
      valor_aluguel: 0,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertImovel & { contrato?: File; fotoCapa?: File; anexos?: File[] }) => {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (!["contrato", "fotoCapa", "anexos"].includes(key) && value != null) {
          formData.append(key, value.toString());
        }
      });
      if (data.contrato) formData.append("contrato", data.contrato);
      if (data.fotoCapa) formData.append("fotoCapa", data.fotoCapa);
      if (data.anexos) {
        data.anexos.forEach((file) => formData.append("anexos", file));
      }
      return apiRequest("POST", "/api/imovel", formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/imovel"] });
      toast({ title: "Imóvel criado com sucesso" });
      setDialogOpen(false);
      form.reset();
      setContratoFile([]);
      setFotoCapaFile([]);
      setAnexosFiles([]);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar imóvel",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<InsertImovel> & { contrato?: File; fotoCapa?: File; anexos?: File[] }) => {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (!["contrato", "fotoCapa", "anexos"].includes(key) && value != null) {
          formData.append(key, value.toString());
        }
      });
      if (data.contrato) formData.append("contrato", data.contrato);
      if (data.fotoCapa) formData.append("fotoCapa", data.fotoCapa);
      if (data.anexos) {
        data.anexos.forEach((file) => formData.append("anexos", file));
      }
      return apiRequest("PATCH", "/api/imovel", formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/imovel"] });
      toast({ title: "Imóvel atualizado com sucesso" });
      setDialogOpen(false);
      setContratoFile([]);
      setFotoCapaFile([]);
      setAnexosFiles([]);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar imóvel",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertImovel) => {
    const payload = {
      ...data,
      contrato: contratoFile[0],
      fotoCapa: fotoCapaFile[0],
      anexos: anexosFiles,
    };

    if (imovel) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  const openDialog = () => {
    if (imovel) {
      form.reset(imovel);
    } else {
      form.reset({
        nome: "",
        endereco: "",
        valor_imovel: 0,
        valor_aluguel: 0,
      });
    }
    setContratoFile([]);
    setFotoCapaFile([]);
    setAnexosFiles([]);
    setDialogOpen(true);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Imóvel</h1>
          <p className="text-muted-foreground">
            Informações do imóvel cadastrado no sistema
          </p>
        </div>
        {isProprietario && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                onClick={openDialog}
                disabled={!imovel && false}
                data-testid="button-edit-imovel"
              >
                {imovel ? (
                  <>
                    <Pencil className="w-4 h-4 mr-2" />
                    Editar Imóvel
                  </>
                ) : (
                  <>
                    <Building2 className="w-4 h-4 mr-2" />
                    Cadastrar Imóvel
                  </>
                )}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {imovel ? "Editar Imóvel" : "Cadastrar Imóvel"}
                </DialogTitle>
                <DialogDescription>
                  Preencha os dados do imóvel. Campos com * são obrigatórios.
                </DialogDescription>
              </DialogHeader>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="nome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome/Descrição *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Ex: Casa no Centro" data-testid="input-nome" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="endereco"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Endereço *</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            placeholder="Rua, número, bairro, cidade, CEP"
                            rows={3}
                            data-testid="input-endereco"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="valor_imovel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valor do Imóvel *</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              onChange={(e) => field.onChange(parseFloat(e.target.value))}
                              data-testid="input-valor-imovel"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="valor_aluguel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valor do Aluguel *</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              onChange={(e) => field.onChange(parseFloat(e.target.value))}
                              data-testid="input-valor-aluguel"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-4 border-t pt-4">
                    <h3 className="font-medium">Arquivos</h3>

                    <FileUpload
                      maxFiles={1}
                      maxSizeMB={10}
                      accept={["pdf", "doc", "docx", "rtf"]}
                      onFilesChange={setContratoFile}
                      label="Contrato (1 arquivo)"
                      hint="PDF, DOC, DOCX ou RTF"
                    />

                    <FileUpload
                      maxFiles={1}
                      maxSizeMB={10}
                      accept={["jpeg", "jpg", "png"]}
                      onFilesChange={setFotoCapaFile}
                      label="Foto de Capa (1 imagem)"
                      hint="JPG, JPEG ou PNG"
                    />

                    <FileUpload
                      maxFiles={10}
                      maxSizeMB={20}
                      accept={["pdf", "zip", "jpeg", "jpg", "png", "doc", "docx", "rtf"]}
                      onFilesChange={setAnexosFiles}
                      label="Anexos Gerais (máx. 10 arquivos)"
                      hint="Documentos e imagens adicionais"
                    />
                  </div>

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
                      disabled={createMutation.isPending || updateMutation.isPending}
                      data-testid="button-save"
                    >
                      {createMutation.isPending || updateMutation.isPending
                        ? "Salvando..."
                        : "Salvar"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {!imovel ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Building2 className="w-16 h-16 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">Nenhum imóvel cadastrado</p>
            <p className="text-sm text-muted-foreground mb-6">
              {isProprietario
                ? "Cadastre o imóvel para começar a gerenciar parcelas e aluguéis"
                : "Aguardando cadastro do imóvel"}
            </p>
            {isProprietario && (
              <Button onClick={openDialog} data-testid="button-create-imovel-empty">
                <Building2 className="w-4 h-4 mr-2" />
                Cadastrar Imóvel
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2" data-testid="card-imovel-details">
            <CardHeader>
              <CardTitle>{imovel.nome}</CardTitle>
              <CardDescription>
                <MapPin className="w-4 h-4 inline mr-1" />
                {imovel.endereco}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Valor do Imóvel</p>
                  <p className="text-3xl font-mono font-bold text-primary" data-testid="text-valor-imovel">
                    R$ {(imovel.valor_imovel || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Valor do Aluguel</p>
                  <p className="text-3xl font-mono font-bold text-primary" data-testid="text-valor-aluguel">
                    R$ {(imovel.valor_aluguel || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Arquivos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {imovel.contrato_arquivo_id && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-muted">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">Contrato anexado</span>
                </div>
              )}
              {imovel.foto_capa_id && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-muted">
                  <ImageIcon className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">Foto de capa</span>
                </div>
              )}
              {!imovel.contrato_arquivo_id && !imovel.foto_capa_id && (
                <p className="text-sm text-muted-foreground">Nenhum arquivo anexado</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
