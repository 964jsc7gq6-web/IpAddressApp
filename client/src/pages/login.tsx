import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Building2, Lock, Mail } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  senha: z.string().min(4, "Senha deve ter no mínimo 4 caracteres"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      senha: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginForm) => {
      const result = await apiRequest("POST", "/api/auth/login", data);
      return result;
    },
    onSuccess: (data) => {
      login(data.usuario, data.token);
      toast({
        title: "Login realizado com sucesso",
        description: `Bem-vindo, ${data.usuario.nome}!`,
      });
      setLocation("/");
    },
    onError: (error: Error) => {
      const errorMessage = error.message || "Erro desconhecido";
      let description = "";
      
      if (errorMessage.includes("Credenciais inválidas")) {
        description = "Email ou senha incorretos. Verifique e tente novamente.";
      } else if (errorMessage.includes("Email e senha são obrigatórios")) {
        description = "Por favor, preencha email e senha.";
      } else if (errorMessage.includes("401")) {
        description = "Email ou senha incorretos. Verifique e tente novamente.";
      } else {
        description = errorMessage;
      }
      
      toast({
        title: "Erro no login",
        description,
        variant: "destructive",
      });
      form.setFocus("email");
    },
  });

  const onSubmit = (data: LoginForm) => {
    if (loginMutation.isPending) {
      return;
    }
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="w-16 h-16 mx-auto bg-primary rounded-2xl flex items-center justify-center">
            <Building2 className="w-8 h-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold">App Ipê</CardTitle>
          <CardDescription>
            Gestão Imobiliária - Entre com suas credenciais
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          {...field}
                          type="email"
                          placeholder="seu@email.com"
                          className="pl-10"
                          data-testid="input-email"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="senha"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          {...field}
                          type="password"
                          placeholder="••••••••"
                          className="pl-10"
                          data-testid="input-password"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={loginMutation.isPending}
                data-testid="button-login"
              >
                {loginMutation.isPending ? "Entrando..." : "Entrar"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
