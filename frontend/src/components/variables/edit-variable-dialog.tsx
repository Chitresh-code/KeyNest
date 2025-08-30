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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useUpdateVariable } from '@/lib/api/variables';
import { EnvVariable } from '@/lib/api/variables';

const editVariableSchema = z.object({
  key: z
    .string()
    .min(1, 'Variable key is required')
    .max(100, 'Variable key must be less than 100 characters')
    .regex(/^[A-Z][A-Z0-9_]*$/, 'Variable key must start with a letter and contain only uppercase letters, numbers, and underscores'),
  value: z
    .string()
    .max(10000, 'Variable value must be less than 10,000 characters'),
});

type EditVariableForm = z.infer<typeof editVariableSchema>;

interface EditVariableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variable: EnvVariable;
}

export default function EditVariableDialog({
  open,
  onOpenChange,
  variable,
}: EditVariableDialogProps) {
  const updateVariableMutation = useUpdateVariable();

  const form = useForm<EditVariableForm>({
    resolver: zodResolver(editVariableSchema),
    defaultValues: {
      key: variable.key,
      value: variable.decrypted_value || '',
    },
  });

  useEffect(() => {
    if (variable) {
      form.reset({
        key: variable.key,
        value: variable.decrypted_value || '',
      });
    }
  }, [variable, form]);

  const onSubmit = async (data: EditVariableForm) => {
    try {
      await updateVariableMutation.mutateAsync({
        variableId: variable.id,
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

  const isValueHidden = variable.decrypted_value === '[HIDDEN]' || variable.decrypted_value === '[NO_ACCESS]';

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Environment Variable</DialogTitle>
          <DialogDescription>
            Update the environment variable. Changes will be encrypted and stored securely.
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
                      placeholder={isValueHidden ? "You don't have permission to view/edit this value" : "Enter the variable value..."}
                      className="resize-none font-mono"
                      rows={4}
                      disabled={isValueHidden}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {isValueHidden 
                      ? "You don't have permission to view or edit this variable's value"
                      : "The value will be encrypted before storage. Leave empty for placeholder variables."
                    }
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
                disabled={updateVariableMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateVariableMutation.isPending}
              >
                {updateVariableMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}