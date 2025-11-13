import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Lock } from "lucide-react";

const alterarSenhaSchema = z.object({
  senhaAtual: z.string().min(1, "Senha atual é obrigatória"),
  novaSenha: z.string().min(6, "Nova senha deve ter no mínimo 6 caracteres"),
  confirmarSenha: z.string().min(1, "Confirmação de senha é obrigatória"),
}).refine((data) => data.novaSenha === data.confirmarSenha, {
  message: "As senhas não coincidem",
  path: ["confirmarSenha"],
});

type AlterarSenhaForm = z.infer<typeof alterarSenhaSchema>;

export default function AlterarSenha() {
  const { toast } = useToast();

  const form = useForm<AlterarSenhaForm>({
    resolver: zodResolver(alterarSenhaSchema),
    defaultValues: {
      senhaAtual: "",
      novaSenha: "",
      confirmarSenha: "",
    },
  });

  const alterarSenhaMutation = useMutation({
    mutationFn: async (data: AlterarSenhaForm) => {
      return apiRequest("PATCH", "/api/auth/senha", {
        senhaAtual: data.senhaAtual,
        novaSenha: data.novaSenha,
      });
    },
    onSuccess: () => {
      toast({
        title: "Senha alterada com sucesso",
        description: "Sua senha foi atualizada.",
      });
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao alterar senha",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AlterarSenhaForm) => {
    alterarSenhaMutation.mutate(data);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Alterar Senha</h1>
        <p className="text-muted-foreground">
          Altere sua senha de acesso ao sistema
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Segurança da Conta
          </CardTitle>
          <CardDescription>
            Escolha uma senha forte com no mínimo 6 caracteres
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="senhaAtual"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha Atual *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        placeholder="Digite sua senha atual"
                        data-testid="input-senha-atual"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="novaSenha"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nova Senha *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        placeholder="Digite a nova senha (mínimo 6 caracteres)"
                        data-testid="input-nova-senha"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmarSenha"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmar Nova Senha *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        placeholder="Digite novamente a nova senha"
                        data-testid="input-confirmar-senha"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => form.reset()}
                  data-testid="button-cancelar"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={alterarSenhaMutation.isPending}
                  data-testid="button-alterar-senha"
                >
                  {alterarSenhaMutation.isPending ? "Alterando..." : "Alterar Senha"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
