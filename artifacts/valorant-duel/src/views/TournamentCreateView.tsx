import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCreateTournament, getListTournamentsQueryKey } from "@workspace/api-client-react";
import { ArrowLeft, Loader2, CalendarIcon, Target, Users, AlertTriangle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

const formSchema = z.object({
  name: z.string().min(3, "Requer mínimo de 3 caracteres").max(80, "Máximo de 80 caracteres"),
  maxParticipants: z.string().optional(),
  deadline: z.date().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function TournamentCreateView() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createTournament = useCreateTournament();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      maxParticipants: "",
    },
  });

  const onSubmit = (values: FormValues) => {
    let maxP = null;
    if (values.maxParticipants) {
      maxP = parseInt(values.maxParticipants, 10);
      if (isNaN(maxP) || maxP < 3 || maxP > 128) {
        form.setError("maxParticipants", { message: "Capacidade deve ser entre 3 e 128" });
        return;
      }
    }

    createTournament.mutate(
      {
        data: {
          name: values.name,
          maxParticipants: maxP,
          registrationDeadline: values.deadline ? values.deadline.toISOString() : null,
        }
      },
      {
        onSuccess: (tournament) => {
          queryClient.invalidateQueries({ queryKey: getListTournamentsQueryKey() });
          toast({
            title: "Operação Inicializada",
            description: "O evento foi criado e já pode receber agentes.",
          });
          setLocation(`/t/${tournament.slug}/manage`);
        },
        onError: () => {
          toast({
            title: "Falha Crítica",
            description: "Não foi possível criar o evento. Tente novamente.",
            variant: "destructive",
          });
        }
      }
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <div className="flex items-center gap-6 pb-6 border-b border-border relative">
        <div className="corner-tl absolute top-0 left-0 w-8 h-8"></div>
        <Link href="/" className="group w-12 h-12 bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors val-clip-tl">
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
        </Link>
        <div>
          <h2 className="text-3xl md:text-4xl font-display uppercase tracking-tighter text-foreground flex items-center gap-3">
            <Target className="text-primary shrink-0" size={28} /> Configurar Operação
          </h2>
          <p className="text-muted-foreground font-sans mt-1">Defina os parâmetros do novo campo de batalha.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 bg-card/50 border border-border p-8 md:p-10 val-clip-br relative">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 relative z-10">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-display uppercase tracking-widest text-foreground text-sm flex items-center gap-2">
                      Nome da Missão
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="EX: VCT CHALLENGERS 2024" 
                        className="bg-background border-border focus-visible:ring-primary rounded-none h-14 text-lg font-display tracking-widest uppercase transition-all"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription className="font-sans text-xs">
                      Este será o título público do evento.
                    </FormDescription>
                    <FormMessage className="font-mono text-xs" />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <FormField
                  control={form.control}
                  name="maxParticipants"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-display uppercase tracking-widest text-foreground text-sm flex items-center gap-2">
                        <Users size={14} className="text-primary" /> Limite de Agentes
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="EX: 16" 
                          className="bg-background border-border focus-visible:ring-primary rounded-none h-14 text-lg font-mono transition-all"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription className="font-sans text-xs">
                        Deixe em branco para ilimitado (Mín 3, Máx 128).
                      </FormDescription>
                      <FormMessage className="font-mono text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="deadline"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="font-display uppercase tracking-widest text-foreground text-sm flex items-center gap-2">
                        <CalendarIcon size={14} className="text-primary" /> Prazo de Inscrição
                      </FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={`w-full bg-background border-border hover:bg-muted focus-visible:ring-primary rounded-none h-14 text-lg font-mono justify-start text-left transition-all ${!field.value && "text-muted-foreground"}`}
                            >
                              {field.value ? format(field.value, "dd/MM/yyyy") : <span>SELECIONAR DATA</span>}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 rounded-none border-border" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                            className="bg-card font-sans"
                          />
                        </PopoverContent>
                      </Popover>
                      <FormDescription className="font-sans text-xs">
                        Data limite para registro no evento.
                      </FormDescription>
                      <FormMessage className="font-mono text-xs" />
                    </FormItem>
                  )}
                />
              </div>

              <div className="pt-8 border-t border-border/50">
                <Button 
                  type="submit" 
                  className="w-full h-16 bg-primary hover:bg-primary/90 text-primary-foreground font-display uppercase tracking-[0.2em] text-lg val-clip-tl transition-all rounded-none"
                  disabled={createTournament.isPending}
                >
                  {createTournament.isPending ? (
                    <><Loader2 className="mr-3 h-6 w-6 animate-spin" /> PROCESSANDO...</>
                  ) : (
                    "INICIALIZAR OPERAÇÃO"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>

        <div className="bg-muted/30 border border-border p-6 val-clip-tl h-fit space-y-6">
          <div className="flex items-center gap-3 text-accent border-b border-border/50 pb-4">
            <AlertTriangle size={20} />
            <h3 className="font-display uppercase tracking-widest">Aviso do Sistema</h3>
          </div>
          <div className="space-y-4 font-sans text-sm text-muted-foreground leading-relaxed">
            <p>
              Ao confirmar a inicialização, o evento entrará imediatamente na fase de <strong>Inscrições Abertas</strong>.
            </p>
            <p>
              O sistema alocará a estrutura (Round Robin ou Suíço) de forma autônoma baseando-se na contagem final de agentes aprovados.
            </p>
            <ul className="list-disc list-inside space-y-2 text-foreground/80 font-mono text-xs mt-4">
              <li>3-6 Agentes: Round Robin</li>
              <li>7+ Agentes: Sistema Suíço</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}