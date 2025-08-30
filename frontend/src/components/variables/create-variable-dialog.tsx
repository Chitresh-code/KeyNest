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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useCreateVariable } from '@/lib/api/variables';

const createVariableSchema = z.object({
  key: z
    .string()
    .min(1, 'Variable key is required')
    .max(100, 'Variable key must be less than 100 characters')
    .regex(/^[A-Z][A-Z0-9_]*$/, 'Variable key must start with a letter and contain only uppercase letters, numbers, and underscores'),
  value: z
    .string()
    .max(10000, 'Variable value must be less than 10,000 characters'),
});

type CreateVariableForm = z.infer<typeof createVariableSchema>;

interface CreateVariableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  environmentId: number;
}

export default function CreateVariableDialog({
  open,
  onOpenChange,
  environmentId,
}: CreateVariableDialogProps) {
  const createVariableMutation = useCreateVariable();

  const form = useForm<CreateVariableForm>({
    resolver: zodResolver(createVariableSchema),
    defaultValues: {
      key: '',
      value: '',
    },
  });

  const onSubmit = async (data: CreateVariableForm) => {
    try {
      await createVariableMutation.mutateAsync({
        ...data,
        environment: environmentId,
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
          <DialogTitle>Add Environment Variable</DialogTitle>
          <DialogDescription>
            Create a new environment variable. All values are encrypted and stored securely.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="key"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Variable Key</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., DATABASE_URL, API_KEY"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Use uppercase letters, numbers, and underscores (e.g., DATABASE_URL)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Variable Value</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter the variable value..."
                      className="resize-none font-mono"
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    The value will be encrypted before storage. Leave empty for placeholder variables.
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
                disabled={createVariableMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createVariableMutation.isPending}
              >
                {createVariableMutation.isPending ? 'Creating...' : 'Create Variable'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}