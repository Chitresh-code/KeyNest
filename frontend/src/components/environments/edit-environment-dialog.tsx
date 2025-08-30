'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useUpdateEnvironment } from '@/lib/api/environments';
import { Environment } from '@/lib/api/environments';

const editEnvironmentSchema = z.object({
  name: z
    .string()
    .min(2, 'Environment name must be at least 2 characters long')
    .max(50, 'Environment name must be less than 50 characters')
    .regex(/^[a-zA-Z0-9\-_]+$/, 'Environment name can only contain letters, numbers, hyphens, and underscores'),
  environment_type: z.enum(['development', 'staging', 'production', 'testing']),
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
});

type EditEnvironmentForm = z.infer<typeof editEnvironmentSchema>;

interface EditEnvironmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  environment: Environment;
}

export default function EditEnvironmentDialog({
  open,
  onOpenChange,
  environment,
}: EditEnvironmentDialogProps) {
  const updateEnvironmentMutation = useUpdateEnvironment();

  const form = useForm<EditEnvironmentForm>({
    resolver: zodResolver(editEnvironmentSchema),
    defaultValues: {
      name: environment.name,
      environment_type: environment.environment_type,
      description: environment.description,
    },
  });

  useEffect(() => {
    if (environment) {
      form.reset({
        name: environment.name,
        environment_type: environment.environment_type,
        description: environment.description,
      });
    }
  }, [environment, form]);

  const onSubmit = async (data: EditEnvironmentForm) => {
    try {
      await updateEnvironmentMutation.mutateAsync({
        environmentId: environment.id,
        data,
      });
      onOpenChange(false);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleClose = () => {
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Environment</DialogTitle>
          <DialogDescription>
            Update the details of this environment. Changes will be visible to all
            team members with access to this project.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Environment Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., production, development, staging"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    A unique name for this environment (lowercase recommended)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="environment_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Environment Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select environment type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="development">Development</SelectItem>
                      <SelectItem value="staging">Staging</SelectItem>
                      <SelectItem value="production">Production</SelectItem>
                      <SelectItem value="testing">Testing</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Choose the type that best describes this environment
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe this environment..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Help your team understand what this environment is used for
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={updateEnvironmentMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateEnvironmentMutation.isPending}
              >
                {updateEnvironmentMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
