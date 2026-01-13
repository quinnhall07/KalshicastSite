import { useState } from "react";
import { useCreateLocation } from "@/hooks/use-weather";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { insertLocationSchema } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";

export function AddLocationDialog() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const createLocation = useCreateLocation();

  const form = useForm<z.infer<typeof insertLocationSchema>>({
    resolver: zodResolver(insertLocationSchema),
    defaultValues: {
      name: "",
      code: "",
      lat: "",
      long: "",
    },
  });

  const onSubmit = (data: z.infer<typeof insertLocationSchema>) => {
    createLocation.mutate(data, {
      onSuccess: () => {
        setOpen(false);
        form.reset();
        toast({
          title: "Location added",
          description: `${data.name} has been added successfully.`,
        });
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-dashed border-white/20 hover:border-primary hover:text-primary">
          <Plus className="mr-2 h-4 w-4" />
          Add Station
        </Button>
      </DialogTrigger>
      <DialogContent className="glass-card border-white/10 text-foreground sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-display">Add Weather Station</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <Label className="text-muted-foreground">Station Name</Label>
                  <FormControl>
                    <Input placeholder="New York Central Park" className="glass-input" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem className="col-span-1">
                    <Label className="text-muted-foreground">Code</Label>
                    <FormControl>
                      <Input placeholder="KNYC" className="glass-input uppercase" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lat"
                render={({ field }) => (
                  <FormItem className="col-span-1">
                    <Label className="text-muted-foreground">Lat</Label>
                    <FormControl>
                      <Input placeholder="40.78" className="glass-input" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="long"
                render={({ field }) => (
                  <FormItem className="col-span-1">
                    <Label className="text-muted-foreground">Long</Label>
                    <FormControl>
                      <Input placeholder="-73.97" className="glass-input" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="pt-2 flex justify-end">
              <Button type="submit" disabled={createLocation.isPending} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                {createLocation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Create Station"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
