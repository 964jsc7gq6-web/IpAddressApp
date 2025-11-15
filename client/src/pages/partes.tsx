import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertParteSchema, type Parte, type InsertParte } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Mail, Phone, User, Pencil, Trash2, FileText, UserPlus, Shield } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { FileUpload } from "@/components/file-upload";
import { FileList } from "@/components/file-list";
import { ConfirmDialog } from "@/components/confirm-dialog";

type ParteComUsuario = Parte & {
  tem_usuario?: boolean;
};

export default function Partes() {
  const { isProprietario } = useAuth();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingParte, setEditingParte] = useState<Parte | null>(null);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [criarUsuarioDialogOpen, setCriarUsuarioDialogOpen] = useState(false);
  const [parteParaUsuario, setParteParaUsuario] = useState<Parte | null>(null);
  const [senha, setSenha] = useState("");

  const { data: partes, isLoading } = useQuery<Parte[]>({
    queryKey: ["/api/partes"],
  });

  const form = useForm<InsertParte>({
    resolver: zodResolver(insertParteSchema),
    defaultValues: {
      tipo: "Comprador",
      nome: "",
      email: "",
      telefone: "",
      rg: "",
      orgao_emissor: "",
      cpf: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertParte & { arquivos?: File[] }) => {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (key !== "arquivos" && value != null) {
          formData.append(key, value.toString());
        }
      });
      if (data.arquivos) {
        data.arquivos.forEach((file) => {
          formData.append("arquivos", file);
        });
      }
      return apiRequest("POST", "/api/partes", formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/partes"] });
      toast({ title: "Parte criada com sucesso" });
      setDialogOpen(false);
      form.reset();
      setNewFiles([]);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar parte",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertParte> & { arquivos?: File[] } }) => {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (key !== "arquivos" && value != null) {
          formData.append(key, value.toString());
        }
      });
      if (data.arquivos) {
        data.arquivos.forEach((file) => {
          formData.append("arquivos", file);
        });
      }
      return apiRequest("PATCH", `/api/partes/${id}`, formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/partes"] });
      toast({ title: "Parte atualizada com sucesso" });
      setDialogOpen(false);
      setEditingParte(null);
      form.reset();
      setNewFiles([]);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar parte",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/partes/${id}`, null),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/partes"] });
      toast({ title: "Parte removida com sucesso" });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao remover parte",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const criarUsuarioMutation = useMutation({
    mutationFn: async ({ parteId, senha }: { parteId: number; senha: string }) => {
      return apiRequest("POST", `/api/partes/${parteId}/criar-usuario`, { senha });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/partes"] });
      toast({ 
        title: "Usuário criado com sucesso",
        description: "O comprador agora pode acessar o sistema" 
      });
      setCriarUsuarioDialogOpen(false);
      setSenha("");
      setParteParaUsuario(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar usuário",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCriarUsuario = () => {
    if (parteParaUsuario && senha.length >= 6) {
      criarUsuarioMutation.mutate({ parteId: parteParaUsuario.id, senha });
    }
  };

  const openCriarUsuarioDialog = (parte: Parte) => {
    setParteParaUsuario(parte);
    setSenha("");
    setCriarUsuarioDialogOpen(true);
  };

  const onSubmit = (data: InsertParte) => {
    if (editingParte) {
      updateMutation.mutate({ id: editingParte.id, data: { ...data, arquivos: newFiles } });
    } else {
      createMutation.mutate({ ...data, arquivos: newFiles });
    }
  };

  const openDialog = (parte?: Parte) => {
    if (parte) {
      setEditingParte(parte);
      form.reset({
        tipo: parte.tipo as "Proprietário" | "Comprador",
        nome: parte.nome,
        email: parte.email,
        telefone: parte.telefone ?? "",
        cpf: parte.cpf,
        rg: parte.rg ?? "",
        orgao_emissor: parte.orgao_emissor ?? "",
      });
    } else {
      setEditingParte(null);
      form.reset({
        tipo: "Comprador",
        nome: "",
        email: "",
        telefone: "",
        rg: "",
        orgao_emissor: "",
        cpf: "",
      });
    }
    setNewFiles([]);
    setDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
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
          <h1 className="text-2xl font-bold">Partes</h1>
          <p className="text-muted-foreground">Gerenciar proprietários e compradores</p>
        </div>
        {isProprietario && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => openDialog()} data-testid="button-new-parte">
                <Plus className="w-4 h-4 mr-2" />
                Nova Parte
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingParte ? "Editar Parte" : "Nova Parte"}
                </DialogTitle>
                <DialogDescription>
                  Preencha os dados da parte. Campos com * são obrigatórios.
                </DialogDescription>
              </DialogHeader>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="tipo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-tipo">
                              <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Proprietário">Proprietário</SelectItem>
                            <SelectItem value="Comprador">Comprador</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="nome"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Nome completo" data-testid="input-nome" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="cpf"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CPF *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="000.000.000-00" data-testid="input-cpf" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email *</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" placeholder="email@exemplo.com" data-testid="input-email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="telefone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefone</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ""} placeholder="(00) 00000-0000" data-testid="input-telefone" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="rg"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>RG</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ""} placeholder="00.000.000-0" data-testid="input-rg" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="orgao_emissor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Órgão Emissor</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ""} placeholder="SSP/SP" data-testid="input-orgao-emissor" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FileUpload
                    maxFiles={3}
                    maxSizeMB={5}
                    accept={["pdf", "zip", "jpeg", "jpg", "png", "doc", "docx", "rtf"]}
                    onFilesChange={setNewFiles}
                    label="Anexos (máx. 3 arquivos)"
                    hint="Documentos da parte"
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

      {!partes || partes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <User className="w-16 h-16 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">Nenhuma parte cadastrada</p>
            <p className="text-sm text-muted-foreground mb-6">
              {isProprietario
                ? "Comece adicionando proprietários e compradores"
                : "Nenhum registro disponível"}
            </p>
            {isProprietario && (
              <Button onClick={() => openDialog()} data-testid="button-new-parte-empty">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Primeira Parte
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {partes.map((parte) => (
            <Card key={parte.id} data-testid={`card-parte-${parte.id}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{parte.nome}</CardTitle>
                    <CardDescription className="mt-1">
                      <Badge
                        variant={parte.tipo === "Proprietário" ? "default" : "secondary"}
                        data-testid={`badge-tipo-${parte.id}`}
                      >
                        {parte.tipo}
                      </Badge>
                    </CardDescription>
                  </div>
                  {isProprietario && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openDialog(parte)}
                        data-testid={`button-edit-${parte.id}`}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <ConfirmDialog
                        trigger={
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            data-testid={`button-delete-${parte.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        }
                        title="Confirmar exclusão"
                        description={`Deseja realmente excluir ${parte.nome}? Esta ação não pode ser desfeita e todos os documentos associados serão removidos.`}
                        confirmText="Excluir"
                        variant="destructive"
                        onConfirm={() => deleteMutation.mutate(parte.id)}
                        disabled={deleteMutation.isPending}
                      />
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="truncate" data-testid={`text-email-${parte.id}`}>{parte.email}</span>
                </div>
                {parte.telefone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span data-testid={`text-telefone-${parte.id}`}>{parte.telefone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <span className="font-mono text-xs" data-testid={`text-cpf-${parte.id}`}>{parte.cpf}</span>
                </div>
                {parte.rg && (
                  <p className="text-xs text-muted-foreground">
                    RG: {parte.rg} {parte.orgao_emissor && `• ${parte.orgao_emissor}`}
                  </p>
                )}
                
                <div className="pt-4 mt-4 border-t space-y-3">
                  <FileList
                    entidade="parte"
                    entidadeId={parte.id}
                    title="Documentos da Parte"
                    emptyMessage="Nenhum documento anexado"
                  />
                  
                  {isProprietario && parte.tipo === "Comprador" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openCriarUsuarioDialog(parte)}
                      disabled={criarUsuarioMutation.isPending}
                      className="w-full"
                      data-testid={`button-criar-usuario-${parte.id}`}
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Criar Acesso ao Sistema
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={criarUsuarioDialogOpen} onOpenChange={setCriarUsuarioDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Acesso ao Sistema</DialogTitle>
            <DialogDescription>
              {parteParaUsuario && (
                <>
                  Criar credenciais de acesso para <strong>{parteParaUsuario.nome}</strong>.
                  O email de login será <strong>{parteParaUsuario.email}</strong>.
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="senha" className="text-sm font-medium">
                Senha *
              </label>
              <Input
                id="senha"
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                data-testid="input-senha-usuario"
              />
              {senha.length > 0 && senha.length < 6 && (
                <p className="text-xs text-destructive">A senha deve ter no mínimo 6 caracteres</p>
              )}
            </div>

            <div className="p-3 bg-muted rounded-md">
              <div className="flex items-start gap-2">
                <Shield className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div className="text-xs text-muted-foreground">
                  <p className="font-medium mb-1">Importante:</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    <li>O comprador terá acesso apenas para visualização</li>
                    <li>Anote a senha e compartilhe com segurança</li>
                    <li>A senha pode ser alterada depois pelo próprio usuário</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCriarUsuarioDialogOpen(false);
                setSenha("");
                setParteParaUsuario(null);
              }}
              disabled={criarUsuarioMutation.isPending}
              data-testid="button-cancel-criar-usuario"
            >
              Cancelar
            </Button>
            <ConfirmDialog
              trigger={
                <Button
                  disabled={senha.length < 6 || criarUsuarioMutation.isPending}
                  data-testid="button-confirmar-criar-usuario"
                >
                  {criarUsuarioMutation.isPending ? "Criando..." : "Criar Acesso"}
                </Button>
              }
              title="Confirmar criação de acesso"
              description="Deseja realmente criar acesso ao sistema para este comprador? Um usuário será criado e poderá fazer login no sistema."
              confirmText="Criar Acesso"
              onConfirm={handleCriarUsuario}
              disabled={senha.length < 6 || criarUsuarioMutation.isPending}
            />
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
