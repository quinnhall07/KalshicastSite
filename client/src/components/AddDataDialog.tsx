import { useState } from "react";
import { useCreateForecast, useCreateObservation, useLocations } from "@/hooks/use-weather";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, TrendingUp, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { insertForecastSchema, insertObservationSchema } from "@shared/schema";

export function AddDataDialog() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const { data: locations } = useLocations();
  const createForecast = useCreateForecast();
  const createObservation = useCreateObservation();

  const forecastForm = useForm<z.infer<typeof insertForecastSchema>>({
    resolver: zodResolver(insertForecastSchema),
    defaultValues: {
      source: "",
      targetDate: new Date().toISOString().split('T')[0],
      highTemp: 0,
    },
  });

  const observationForm = useForm<z.infer<typeof insertObservationSchema>>({
    resolver: zodResolver(insertObservationSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      highTemp: 0,
    },
  });

  const onForecastSubmit = (data: z.infer<typeof insertForecastSchema>) => {
    createForecast.mutate(data, {
      onSuccess: () => {
        setOpen(false);
        forecastForm.reset();
        toast({ title: "Forecast Added", description: "Prediction data saved." });
      },
      onError: (err) => toast({ title: "Error", description: err.message, variant: "destructive" }),
    });
  };

  const onObservationSubmit = (data: z.infer<typeof insertObservationSchema>) => {
    createObservation.mutate(data, {
      onSuccess: () => {
        setOpen(false);
        observationForm.reset();
        toast({ title: "Observation Added", description: "Actual weather data saved." });
      },
      onError: (err) => toast({ title: "Error", description: err.message, variant: "destructive" }),
    });
  };

  if (!locations?.length) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20">
          Add Data
        </Button>
      </DialogTrigger>
      <DialogContent className="glass-card border-white/10 text-foreground sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-display">Record Weather Data</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="forecast" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-background/50 border border-white/5">
            <TabsTrigger value="forecast" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
              <TrendingUp className="mr-2 h-4 w-4" /> Forecast
            </TabsTrigger>
            <TabsTrigger value="observation" className="data-[state=active]:bg-secondary/20 data-[state=active]:text-secondary">
              <Eye className="mr-2 h-4 w-4" /> Observation
            </TabsTrigger>
          </TabsList>

          <TabsContent value="forecast" className="pt-4">
            <Form {...forecastForm}>
              <form onSubmit={forecastForm.handleSubmit(onForecastSubmit)} className="space-y-4">
                <FormField
                  control={forecastForm.control}
                  name="locationId"
                  render={({ field }) => (
                    <FormItem>
                      <Label>Location</Label>
                      <Select onValueChange={(val) => field.onChange(parseInt(val))} defaultValue={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger className="glass-input">
                            <SelectValue placeholder="Select station" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {locations.map((loc) => (
                            <SelectItem key={loc.id} value={loc.id.toString()}>{loc.name} ({loc.code})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={forecastForm.control}
                    name="source"
                    render={({ field }) => (
                      <FormItem>
                        <Label>Source Model</Label>
                        <FormControl>
                          <Input placeholder="NOAA" className="glass-input" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={forecastForm.control}
                    name="targetDate"
                    render={({ field }) => (
                      <FormItem>
                        <Label>Target Date</Label>
                        <FormControl>
                          <Input type="date" className="glass-input" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={forecastForm.control}
                  name="highTemp"
                  render={({ field }) => (
                    <FormItem>
                      <Label>Predicted High (°F)</Label>
                      <FormControl>
                        <Input 
                          type="number" 
                          className="glass-input text-lg font-mono" 
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" disabled={createForecast.isPending} className="w-full mt-4">
                  {createForecast.isPending ? <Loader2 className="animate-spin" /> : "Save Forecast"}
                </Button>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="observation" className="pt-4">
            <Form {...observationForm}>
              <form onSubmit={observationForm.handleSubmit(onObservationSubmit)} className="space-y-4">
                <FormField
                  control={observationForm.control}
                  name="locationId"
                  render={({ field }) => (
                    <FormItem>
                      <Label>Location</Label>
                      <Select onValueChange={(val) => field.onChange(parseInt(val))} defaultValue={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger className="glass-input">
                            <SelectValue placeholder="Select station" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {locations.map((loc) => (
                            <SelectItem key={loc.id} value={loc.id.toString()}>{loc.name} ({loc.code})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={observationForm.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <Label>Date Observed</Label>
                        <FormControl>
                          <Input type="date" className="glass-input" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={observationForm.control}
                    name="highTemp"
                    render={({ field }) => (
                      <FormItem>
                        <Label>Actual High (°F)</Label>
                        <FormControl>
                          <Input 
                            type="number" 
                            className="glass-input text-lg font-mono text-secondary" 
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button type="submit" variant="secondary" disabled={createObservation.isPending} className="w-full mt-4">
                  {createObservation.isPending ? <Loader2 className="animate-spin" /> : "Save Observation"}
                </Button>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
