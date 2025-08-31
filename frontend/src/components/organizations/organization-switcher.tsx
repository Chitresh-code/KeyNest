'use client';

import React, { useState } from 'react';
import { Check, ChevronDown, Plus, Settings, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { useOrganizations } from '@/lib/api/organizations';
import { useOrganizationStore } from '@/lib/stores/organization';
import { cn } from '@/lib/utils';
import CreateOrganizationDialog from './create-organization-dialog';
import OrganizationSettingsDialog from './organization-settings-dialog';

export default function OrganizationSwitcher() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const { data: organizationsData, isLoading } = useOrganizations();
  const { currentOrganization, setCurrentOrganization, switchOrganization } = useOrganizationStore();
  
  const organizations = organizationsData?.results || [];

  // Auto-select first organization if none selected
  React.useEffect(() => {
    if (!currentOrganization && organizations.length > 0 && !isLoading) {
      setCurrentOrganization(organizations[0]);
    }
  }, [organizations, currentOrganization, setCurrentOrganization, isLoading]);

  const handleOrganizationSelect = (org: any) => {
    // If switching to a different organization, use switchOrganization to redirect
    if (currentOrganization?.id !== org.id) {
      switchOrganization(org);
    } else {
      setCurrentOrganization(org);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        <div className="w-24 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            className="justify-between min-w-[180px] bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center space-x-2 min-w-0">
              <Building className="h-4 w-4 flex-shrink-0 text-gray-500" />
              <span className="truncate">
                {currentOrganization?.name || 'Select Organization'}
              </span>
            </div>
            <ChevronDown className="h-4 w-4 flex-shrink-0 text-gray-500" />
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="start" className="w-[240px]">
          <DropdownMenuLabel className="text-xs text-gray-500 dark:text-gray-400">
            Your Organizations
          </DropdownMenuLabel>
          
          {organizations.map((org) => (
            <DropdownMenuItem
              key={org.id}
              onClick={() => handleOrganizationSelect(org)}
              className="flex items-center justify-between p-2"
            >
              <div className="flex items-center space-x-2 min-w-0">
                <Building className="h-4 w-4 flex-shrink-0 text-gray-400" />
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 dark:text-foreground truncate">
                    {org.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {org.project_count} projects • {org.member_count} members
                  </p>
                </div>
              </div>
              {currentOrganization?.id === org.id && (
                <Check className="h-4 w-4 text-blue-600 flex-shrink-0" />
              )}
            </DropdownMenuItem>
          ))}

          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Organization
          </DropdownMenuItem>
          
          {currentOrganization && (
            <DropdownMenuItem onClick={() => setIsSettingsOpen(true)}>
              <Settings className="h-4 w-4 mr-2" />
              Organization Settings
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <CreateOrganizationDialog 
        open={isCreateOpen} 
        onOpenChange={setIsCreateOpen} 
      />

      {currentOrganization && (
        <OrganizationSettingsDialog
          open={isSettingsOpen}
          onOpenChange={setIsSettingsOpen}
          organizationId={currentOrganization.id}
        />
      )}
    </>
  );
}