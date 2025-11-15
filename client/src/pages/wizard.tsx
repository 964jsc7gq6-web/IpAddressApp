import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Progress } from "@/components/ui/progress";
import { Building2, User, Users, Calendar } from "lucide-react";

const proprietarioSchema = z.object({
  nome: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  email: z.string().email("Email inválido"),
  senha: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  cpf: z.string().min(11, "CPF inválido"),
  rg: z.string().optional(),
  orgaoEmissor: z.string().optional(),
  telefone: z.string().optional(),
});

const compradorSchema = z.object({
  nome: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  email: z.string().email("Email inválido"),
  cpf: z.string().min(11, "CPF inválido"),
  rg: z.string().optional(),
  orgaoEmissor: z.string().optional(),
  telefone: z.string().optional(),
});

const imovelSchema = z.object({
  nome: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  endereco: z.string().min(5, "Endereço inválido"),
  valorImovel: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: "Valor deve ser maior que zero",
  }),
  valorAluguel: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: "Valor deve ser maior que zero",
  }),
});

const configuracaoSchema = z.object({
  dataInicioContrato: z.string().min(1, "Data de início é obrigatória"),
});

type ProprietarioData = z.infer<typeof proprietarioSchema>;
type CompradorData = z.infer<typeof compradorSchema>;
type ImovelData = z.infer<typeof imovelSchema>;
type ConfiguracaoData = z.infer<typeof configuracaoSchema>;

export default function Wizard() {
  const [step, setStep] = useState(1);
  const { toast } = useToast();
  const [wizardData, setWizardData] = useState({
    proprietario: {} as ProprietarioData,
    comprador: {} as CompradorData,
    imovel: {} as ImovelData,
    dataInicioContrato: "",
  });

  const proprietarioForm = useForm<ProprietarioData>({
    resolver: zodResolver(proprietarioSchema),
    defaultValues: {
      nome: "",
      email: "",
      senha: "",
      cpf: "",
      rg: "",
      orgaoEmissor: "",
      telefone: "",
    },
  });

  const compradorForm = useForm<CompradorData>({
    resolver: zodResolver(compradorSchema),
    defaultValues: {
      nome: "",
      email: "",
      cpf: "",
      rg: "",
      orgaoEmissor: "",
      telefone: "",
    },
  });

  const imovelForm = useForm<ImovelData>({
    resolver: zodResolver(imovelSchema),
    defaultValues: {
      nome: "",
      endereco: "",
      valorImovel: "",
      valorAluguel: "",
    },
  });

  const configuracaoForm = useForm<ConfiguracaoData>({
    resolver: zodResolver(configuracaoSchema),
    defaultValues: {
      dataInicioContrato: "",
    },
  });

  const finalizarMutation = useMutation({
    mutationFn: async (data: typeof wizardData) => {
      return await apiRequest("POST", "/api/configuracao/wizard", data);
    },
    onSuccess: () => {
      toast({
        title: "Configuração concluída!",
        description: "O sistema foi configurado com sucesso. Você será redirecionado para o login.",
      });
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro na configuração",
        description: error.message || "Ocorreu um erro ao finalizar a configuração. Por favor, tente novamente.",
        variant: "destructive",
      });
    },
  });

  const onProprietarioSubmit = (data: ProprietarioData) => {
    setWizardData({ ...wizardData, proprietario: data });
    setStep(2);
  };

  const onCompradorSubmit = (data: CompradorData) => {
    setWizardData({ ...wizardData, comprador: data });
    setStep(3);
  };

  const onImovelSubmit = (data: ImovelData) => {
    setWizardData({ ...wizardData, imovel: data });
    setStep(4);
  };

  const onConfiguracaoSubmit = (data: ConfiguracaoData) => {
    if (finalizarMutation.isPending) return;
    const finalData = { ...wizardData, dataInicioContrato: data.dataInicioContrato };
    finalizarMutation.mutate(finalData);
  };

  const totalSteps = 4;
  const progress = finalizarMutation.isSuccess 
    ? 100 
    : ((step - 1) / totalSteps) * 100;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">Configuração Inicial - App Ipê</CardTitle>
          <CardDescription>
            Passo {step} de {totalSteps}
          </CardDescription>
          <Progress value={progress} className="mt-4" />
        </CardHeader>

        <CardContent>
          {step === 1 && (
            <Form {...proprietarioForm}>
              <form onSubmit={proprietarioForm.handleSubmit(onProprietarioSubmit)} className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <User className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold">Dados do Proprietário (Administrador)</h3>
                </div>

                <FormField
                  control={proprietarioForm.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome Completo</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="João da Silva" data-testid="input-proprietario-nome" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={proprietarioForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" placeholder="joao@email.com" data-testid="input-proprietario-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={proprietarioForm.control}
                  name="senha"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha</FormLabel>
                      <FormControl>
                        <Input {...field} type="password" placeholder="••••••••" data-testid="input-proprietario-senha" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={proprietarioForm.control}
                    name="cpf"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CPF</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="000.000.000-00" data-testid="input-proprietario-cpf" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={proprietarioForm.control}
                    name="telefone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone (Opcional)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="(00) 00000-0000" data-testid="input-proprietario-telefone" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={proprietarioForm.control}
                    name="rg"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>RG (Opcional)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="00.000.000-0" data-testid="input-proprietario-rg" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={proprietarioForm.control}
                    name="orgaoEmissor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Órgão Emissor (Opcional)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="SSP" data-testid="input-proprietario-orgao" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button type="submit" className="w-full" data-testid="button-next-step">
                  Próximo
                </Button>
              </form>
            </Form>
          )}

          {step === 2 && (
            <Form {...compradorForm}>
              <form onSubmit={compradorForm.handleSubmit(onCompradorSubmit)} className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Users className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold">Dados do Comprador</h3>
                </div>

                <FormField
                  control={compradorForm.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome Completo</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Maria Santos" data-testid="input-comprador-nome" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={compradorForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" placeholder="maria@email.com" data-testid="input-comprador-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={compradorForm.control}
                    name="cpf"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CPF</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="000.000.000-00" data-testid="input-comprador-cpf" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={compradorForm.control}
                    name="telefone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone (Opcional)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="(00) 00000-0000" data-testid="input-comprador-telefone" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={compradorForm.control}
                    name="rg"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>RG (Opcional)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="00.000.000-0" data-testid="input-comprador-rg" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={compradorForm.control}
                    name="orgaoEmissor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Órgão Emissor (Opcional)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="SSP" data-testid="input-comprador-orgao" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1" data-testid="button-previous-step">
                    Voltar
                  </Button>
                  <Button type="submit" className="flex-1" data-testid="button-next-step">
                    Próximo
                  </Button>
                </div>
              </form>
            </Form>
          )}

          {step === 3 && (
            <Form {...imovelForm}>
              <form onSubmit={imovelForm.handleSubmit(onImovelSubmit)} className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Building2 className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold">Dados do Imóvel</h3>
                </div>

                <FormField
                  control={imovelForm.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome/Identificação do Imóvel</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Apartamento Ipê" data-testid="input-imovel-nome" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={imovelForm.control}
                  name="endereco"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Endereço Completo</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Rua das Flores, 123 - Centro" data-testid="input-imovel-endereco" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={imovelForm.control}
                    name="valorImovel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor do Imóvel (R$)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" step="0.01" placeholder="250000.00" data-testid="input-imovel-valor" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={imovelForm.control}
                    name="valorAluguel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor do Aluguel (R$)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" step="0.01" placeholder="1500.00" data-testid="input-imovel-aluguel" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setStep(2)} className="flex-1" data-testid="button-previous-step">
                    Voltar
                  </Button>
                  <Button type="submit" className="flex-1" data-testid="button-next-step">
                    Próximo
                  </Button>
                </div>
              </form>
            </Form>
          )}

          {step === 4 && (
            <Form {...configuracaoForm}>
              <form onSubmit={configuracaoForm.handleSubmit(onConfiguracaoSubmit)} className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold">Configurações do Contrato</h3>
                </div>

                <FormField
                  control={configuracaoForm.control}
                  name="dataInicioContrato"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Início do Contrato</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" data-testid="input-data-inicio" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
                  <p className="font-semibold">Resumo da Configuração:</p>
                  <p><strong>Proprietário:</strong> {wizardData.proprietario.nome}</p>
                  <p><strong>Comprador:</strong> {wizardData.comprador.nome}</p>
                  <p><strong>Imóvel:</strong> {wizardData.imovel.nome}</p>
                </div>

                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setStep(3)} className="flex-1" data-testid="button-previous-step">
                    Voltar
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={finalizarMutation.isPending}
                    data-testid="button-finish-wizard"
                  >
                    {finalizarMutation.isPending ? "Finalizando..." : "Finalizar"}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
