'use client';

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
import { useCreateEnvironment } from '@/lib/api/environments';

const createEnvironmentSchema = z.object({
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

type CreateEnvironmentForm = z.infer<typeof createEnvironmentSchema>;

interface CreateEnvironmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: number;
}

export default function CreateEnvironmentDialog({
  open,
  onOpenChange,
  projectId,
}: CreateEnvironmentDialogProps) {
  const createEnvironmentMutation = useCreateEnvironment();

  const form = useForm<CreateEnvironmentForm>({
    resolver: zodResolver(createEnvironmentSchema),
    defaultValues: {
      name: '',
      description: '',
      environment_type: 'development',
    },
  });

  const onSubmit = async (data: CreateEnvironmentForm) => {
    try {
      await createEnvironmentMutation.mutateAsync({
        ...data,
        project: projectId,
      });
      form.reset();
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
          <DialogTitle>Create New Environment</DialogTitle>
          <DialogDescription>
            Create a new environment to organize your variables by deployment stage.
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
                    defaultValue={field.value}
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
                disabled={createEnvironmentMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createEnvironmentMutation.isPending}
              >
                {createEnvironmentMutation.isPending ? 'Creating...' : 'Create Environment'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
