'use client';

import React, { useState } from 'react';
import { Settings, Users, Plus, Mail, Shield, Trash2, Edit, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { 
  useOrganization,
  useUpdateOrganization,
  useOrganizationMembers,
  useInviteUser,
  useUpdateMemberRole,
  useRemoveMember,
  type Organization,
  type InviteUserData
} from '@/lib/api/organizations';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import DeleteConfirmDialog from '@/components/common/delete-confirm-dialog';

interface OrganizationSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: number;
}

const roleColors = {
  admin: 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300',
  editor: 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300',
  viewer: 'bg-gray-100 dark:bg-gray-900/20 text-gray-800 dark:text-gray-300',
};

const roleDescriptions = {
  admin: 'Full access to organization and all projects',
  editor: 'Can manage projects and environment variables',
  viewer: 'Read-only access to projects and variables',
};

export default function OrganizationSettingsDialog({
  open,
  onOpenChange,
  organizationId
}: OrganizationSettingsDialogProps) {
  const [activeTab, setActiveTab] = useState('general');
  const [editMode, setEditMode] = useState(false);
  const [orgName, setOrgName] = useState('');
  const [orgDescription, setOrgDescription] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'editor' | 'viewer'>('viewer');
  const [removeMember, setRemoveMember] = useState<any>(null);

  const { data: organization } = useOrganization(organizationId);
  const { data: membersData } = useOrganizationMembers(organizationId);
  const updateOrgMutation = useUpdateOrganization();
  const inviteUserMutation = useInviteUser();
  const updateRoleMutation = useUpdateMemberRole();
  const removeMemberMutation = useRemoveMember();

  const members = membersData?.results || [];
  const currentUserRole = organization?.user_role;
  const canManageMembers = currentUserRole === 'admin';
  const canEditOrg = currentUserRole === 'admin';

  // Initialize form when organization data loads
  React.useEffect(() => {
    if (organization && !editMode) {
      setOrgName(organization.name);
      setOrgDescription(organization.description || '');
    }
  }, [organization, editMode]);

  const handleSaveOrganization = async () => {
    if (!organization) return;

    try {
      await updateOrgMutation.mutateAsync({
        organizationId: organization.id,
        data: {
          name: orgName.trim(),
          description: orgDescription.trim()
        }
      });
      setEditMode(false);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleInviteUser = async () => {
    if (!inviteEmail.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    try {
      await inviteUserMutation.mutateAsync({
        organizationId,
        data: { email: inviteEmail.trim(), role: inviteRole }
      });
      setInviteEmail('');
      setInviteRole('viewer');
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleUpdateRole = async (memberId: number, newRole: 'admin' | 'editor' | 'viewer') => {
    try {
      await updateRoleMutation.mutateAsync({
        organizationId,
        memberId,
        data: { role: newRole }
      });
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleRemoveMember = async () => {
    if (!removeMember) return;

    try {
      await removeMemberMutation.mutateAsync({
        organizationId,
        memberId: removeMember.id
      });
      setRemoveMember(null);
    } catch (error) {
      // Error handled by mutation
    }
  };

  if (!organization) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>{organization.name} Settings</span>
            </DialogTitle>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="members">
                Members ({members.length})
              </TabsTrigger>
            </TabsList>

            {/* General Settings */}
            <TabsContent value="general" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-foreground">
                    Organization Details
                  </h3>
                  {canEditOrg && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditMode(!editMode)}
                      disabled={updateOrgMutation.isPending}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      {editMode ? 'Cancel' : 'Edit'}
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="org-name">Organization Name</Label>
                    {editMode ? (
                      <Input
                        id="org-name"
                        value={orgName}
                        onChange={(e) => setOrgName(e.target.value)}
                        placeholder="Organization name"
                        className="mt-1"
                      />
                    ) : (
                      <p className="mt-1 text-sm text-gray-900 dark:text-foreground bg-gray-50 dark:bg-gray-800 p-2 rounded">
                        {organization.name}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label>Created</Label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-foreground bg-gray-50 dark:bg-gray-800 p-2 rounded">
                      {formatDistanceToNow(new Date(organization.created_at))} ago
                    </p>
                  </div>
                </div>

                <div>
                  <Label htmlFor="org-description">Description</Label>
                  {editMode ? (
                    <Textarea
                      id="org-description"
                      value={orgDescription}
                      onChange={(e) => setOrgDescription(e.target.value)}
                      placeholder="Organization description (optional)"
                      className="mt-1"
                      rows={3}
                    />
                  ) : (
                    <p className="mt-1 text-sm text-gray-900 dark:text-foreground bg-gray-50 dark:bg-gray-800 p-2 rounded min-h-[80px]">
                      {organization.description || 'No description provided'}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Projects</Label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-foreground bg-gray-50 dark:bg-gray-800 p-2 rounded">
                      {organization.project_count}
                    </p>
                  </div>
                  <div>
                    <Label>Members</Label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-foreground bg-gray-50 dark:bg-gray-800 p-2 rounded">
                      {organization.member_count}
                    </p>
                  </div>
                </div>

                {editMode && (
                  <div className="flex justify-end space-x-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditMode(false);
                        setOrgName(organization.name);
                        setOrgDescription(organization.description || '');
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSaveOrganization}
                      disabled={updateOrgMutation.isPending || !orgName.trim()}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {updateOrgMutation.isPending ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Members */}
            <TabsContent value="members" className="space-y-4 mt-4">
              <div className="space-y-4">
                {/* Invite Section */}
                {canManageMembers && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-3">
                      Invite New Member
                    </h4>
                    <div className="flex space-x-2">
                      <Input
                        placeholder="Enter email address"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        className="flex-1"
                        onKeyDown={(e) => e.key === 'Enter' && handleInviteUser()}
                      />
                      <Select value={inviteRole} onValueChange={setInviteRole}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="viewer">Viewer</SelectItem>
                          <SelectItem value="editor">Editor</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        onClick={handleInviteUser}
                        disabled={inviteUserMutation.isPending || !inviteEmail.trim()}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Mail className="h-4 w-4 mr-2" />
                        {inviteUserMutation.isPending ? 'Sending...' : 'Invite'}
                      </Button>
                    </div>
                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
                      An invitation email will be sent to the user
                    </p>
                  </div>
                )}

                {/* Members List */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-foreground mb-3">
                    Organization Members
                  </h4>
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Member</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Joined</TableHead>
                          {canManageMembers && <TableHead className="w-[100px]">Actions</TableHead>}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {members.map((member) => (
                          <TableRow key={member.id}>
                            <TableCell>
                              <div>
                                <div className="flex items-center space-x-2">
                                  <p className="font-medium text-gray-900 dark:text-foreground">
                                    {member.full_name || member.username}
                                  </p>
                                  {member.is_owner && (
                                    <Crown className="h-4 w-4 text-yellow-500" title="Organization Owner" />
                                  )}
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {member.email}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={roleColors[member.role]}>
                                {member.role}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {formatDistanceToNow(new Date(member.joined_at))} ago
                              </div>
                            </TableCell>
                            {canManageMembers && (
                              <TableCell>
                                {!member.is_owner && (
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm">
                                        <Settings className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <div className="px-2 py-1.5">
                                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                          Change Role
                                        </p>
                                      </div>
                                      {['admin', 'editor', 'viewer'].map((role) => (
                                        <DropdownMenuItem
                                          key={role}
                                          onClick={() => handleUpdateRole(member.id, role as any)}
                                          disabled={role === member.role}
                                        >
                                          <Shield className="h-4 w-4 mr-2" />
                                          <div>
                                            <p className="font-medium capitalize">{role}</p>
                                            <p className="text-xs text-gray-500">
                                              {roleDescriptions[role as keyof typeof roleDescriptions]}
                                            </p>
                                          </div>
                                        </DropdownMenuItem>
                                      ))}
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        onClick={() => setRemoveMember(member)}
                                        className="text-red-600 dark:text-red-400"
                                      >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Remove Member
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                )}
                              </TableCell>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Remove Member Confirmation */}
      {removeMember && (
        <DeleteConfirmDialog
          open={!!removeMember}
          onOpenChange={() => setRemoveMember(null)}
          title="Remove Member"
          description={`Are you sure you want to remove ${removeMember.full_name || removeMember.username} from this organization? They will lose access to all projects and data.`}
          onConfirm={handleRemoveMember}
          isLoading={removeMemberMutation.isPending}
          confirmText="Remove Member"
        />
      )}
    </>
  );
}