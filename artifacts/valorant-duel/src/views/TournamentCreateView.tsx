import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCreateTournament, getListTournamentsQueryKey } from "@workspace/api-client-react";
import { ArrowLeft, Loader2, CalendarIcon } from "lucide-react";
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
  name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres").max(80, "O nome deve ter menos de 80 caracteres"),
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
        form.setError("maxParticipants", { message: "Deve ser entre 3 e 128" });
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
            title: "Torneio criado",
            description: "Seu torneio foi criado com sucesso.",
          });
          setLocation(`/t/${tournament.slug}/manage`);
        },
        onError: () => {
          toast({
            title: "Erro",
            description: "Falha ao criar o torneio. Por favor, tente novamente.",
            variant: "destructive",
          });
        }
      }
    );
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/" className="w-10 h-10 bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors val-clip-tl">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h2 className="text-3xl font-display uppercase tracking-wider text-foreground">Criar Torneio</h2>
          <p className="text-muted-foreground">Configure uma nova competição.</p>
        </div>
      </div>

      <div className="bg-card border border-border p-8 val-clip-tl">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-display uppercase tracking-wider text-muted-foreground">Nome do Torneio</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="ex. VCT Challengers 2024" 
                      className="bg-background border-border focus-visible:ring-primary rounded-none h-12 text-lg font-display tracking-wide uppercase"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Este será o nome público do seu evento.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="maxParticipants"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-display uppercase tracking-wider text-muted-foreground">Capacidade (Opcional)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="ex. 16" 
                      className="bg-background border-border focus-visible:ring-primary rounded-none h-12 text-lg font-mono"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Deixe em branco para ilimitado. Mín: 3, Máx: 128.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="deadline"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="font-display uppercase tracking-wider text-muted-foreground">Prazo de Inscrição (Opcional)</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={`w-full bg-background border-border hover:bg-muted focus-visible:ring-primary rounded-none h-12 text-lg font-mono justify-start text-left ${!field.value && "text-muted-foreground"}`}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value ? format(field.value, "dd/MM/yyyy") : <span>Escolha uma data</span>}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    As inscrições fecham automaticamente após esta data.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="pt-4 border-t border-border">
              <Button 
                type="submit" 
                className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-display uppercase tracking-widest text-lg val-clip-br rounded-none"
                disabled={createTournament.isPending}
              >
                {createTournament.isPending ? (
                  <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Iniciando...</>
                ) : (
                  "Criar Evento"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}