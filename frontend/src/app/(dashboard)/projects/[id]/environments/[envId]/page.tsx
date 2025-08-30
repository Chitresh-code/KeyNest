'use client';

import { useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Plus, 
  Search, 
  Settings, 
  Trash2, 
  Edit, 
  Eye, 
  EyeOff, 
  Copy, 
  Download, 
  Upload,
  Key
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { useEnvironment } from '@/lib/api/environments';
import { useEnvironmentVariables, useDeleteVariable, useExportEnvironment, useImportEnvironment } from '@/lib/api/variables';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import CreateVariableDialog from '@/components/variables/create-variable-dialog';
import EditVariableDialog from '@/components/variables/edit-variable-dialog';
import DeleteConfirmDialog from '@/components/common/delete-confirm-dialog';

const environmentTypeColors = {
  development: 'bg-blue-100 text-blue-800',
  staging: 'bg-yellow-100 text-yellow-800', 
  production: 'bg-red-100 text-red-800',
  testing: 'bg-green-100 text-green-800',
};

export default function EnvironmentVariablesPage() {
  const params = useParams();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const projectId = parseInt(params.id as string);
  const environmentId = parseInt(params.envId as string);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editVariable, setEditVariable] = useState<any>(null);
  const [deleteVariable, setDeleteVariable] = useState<any>(null);
  const [hiddenValues, setHiddenValues] = useState<Set<number>>(new Set());

  const { data: environment, isLoading: environmentLoading } = useEnvironment(environmentId);
  const { data: variablesData, isLoading: variablesLoading } = useEnvironmentVariables(environmentId);
  const deleteVariableMutation = useDeleteVariable();
  const exportEnvironmentMutation = useExportEnvironment();
  const importEnvironmentMutation = useImportEnvironment();

  const variables = variablesData?.results || [];

  const filteredVariables = variables.filter((variable: any) =>
    variable.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (variable.decrypted_value && variable.decrypted_value.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const toggleValueVisibility = (variableId: number) => {
    setHiddenValues(prev => {
      const newSet = new Set(prev);
      if (newSet.has(variableId)) {
        newSet.delete(variableId);
      } else {
        newSet.add(variableId);
      }
      return newSet;
    });
  };

  const copyToClipboard = async (key: string, value: string) => {
    try {
      const envFormat = `${key}=${value}`;
      await navigator.clipboard.writeText(envFormat);
      toast.success('Copied to clipboard!');
    } catch (err) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const handleDeleteVariable = async () => {
    if (!deleteVariable) return;
    
    try {
      await deleteVariableMutation.mutateAsync(deleteVariable.id);
      setDeleteVariable(null);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleExport = () => {
    exportEnvironmentMutation.mutate(environmentId);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      importEnvironmentMutation.mutate({ environmentId, file });
      // Reset the input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (environmentLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading environment...</p>
        </div>
      </div>
    );
  }

  if (!environment) {
    return (
      <div className="text-center py-12">
        <h2 className="text-lg font-medium text-gray-900 mb-2">Environment not found</h2>
        <p className="text-gray-600 mb-4">The environment you're looking for doesn't exist or you don't have access to it.</p>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h1 className="text-2xl font-bold text-gray-900">{environment.name}</h1>
            <Badge className={environmentTypeColors[environment.environment_type]}>
              {environment.environment_type}
            </Badge>
          </div>
          <p className="text-gray-600">{environment.description || 'No description'}</p>
        </div>
      </div>

      {/* Environment Info */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Project</label>
              <p className="text-gray-900">{environment.project_name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Variables</label>
              <p className="text-gray-900">{environment.variable_count}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Created</label>
              <p className="text-gray-900">
                {formatDistanceToNow(new Date(environment.created_at))} ago
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Created By</label>
              <p className="text-gray-900">{environment.created_by_name}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Variables Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Environment Variables</h2>
            <p className="text-gray-600">
              Manage variables for the {environment.name} environment
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  Actions
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleImportClick}>
                  <Upload className="h-4 w-4 mr-2" />
                  Import from .env
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExport}>
                  <Download className="h-4 w-4 mr-2" />
                  Export to .env
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Variable
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search variables..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Variables Table */}
        {variablesLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading variables...</span>
          </div>
        ) : filteredVariables.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Key className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? 'No variables found' : 'No variables yet'}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm 
                  ? 'Try adjusting your search terms'
                  : 'Add your first environment variable to get started'
                }
              </p>
              {!searchTerm && (
                <Button onClick={() => setIsCreateOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Variable
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Key</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVariables.map((variable: any) => {
                  const isValueHidden = hiddenValues.has(variable.id);
                  const displayValue = variable.decrypted_value === '[HIDDEN]' || variable.decrypted_value === '[NO_ACCESS]'
                    ? variable.decrypted_value
                    : isValueHidden 
                      ? '•'.repeat(Math.min(variable.decrypted_value?.length || 0, 20))
                      : variable.decrypted_value;

                  return (
                    <TableRow key={variable.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                            {variable.key}
                          </code>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2 max-w-md">
                          <code className="text-sm font-mono bg-gray-50 px-2 py-1 rounded truncate flex-1">
                            {displayValue || '(empty)'}
                          </code>
                          {variable.decrypted_value !== '[HIDDEN]' && variable.decrypted_value !== '[NO_ACCESS]' && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleValueVisibility(variable.id)}
                                className="h-6 w-6 p-0"
                              >
                                {isValueHidden ? (
                                  <Eye className="h-3 w-3" />
                                ) : (
                                  <EyeOff className="h-3 w-3" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(variable.key, variable.decrypted_value)}
                                className="h-6 w-6 p-0"
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-500">
                          {formatDistanceToNow(new Date(variable.created_at))} ago
                          {variable.created_by_name && (
                            <div className="text-xs">by {variable.created_by_name}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Settings className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditVariable(variable)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => setDeleteVariable(variable)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>

      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept="*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Dialogs */}
      <CreateVariableDialog 
        open={isCreateOpen} 
        onOpenChange={setIsCreateOpen}
        environmentId={environmentId}
      />

      {editVariable && (
        <EditVariableDialog 
          open={!!editVariable} 
          onOpenChange={() => setEditVariable(null)}
          variable={editVariable}
        />
      )}

      {deleteVariable && (
        <DeleteConfirmDialog
          open={!!deleteVariable}
          onOpenChange={() => setDeleteVariable(null)}
          title="Delete Variable"
          description={`Are you sure you want to delete "${deleteVariable.key}"? This action cannot be undone.`}
          onConfirm={handleDeleteVariable}
          isLoading={deleteVariableMutation.isPending}
        />
      )}
    </div>
  );
}