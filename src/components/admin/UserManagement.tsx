import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Users as UsersIcon, 
  Plus, 
  Trash2, 
  Shield,
  Mail,
  Crown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

type AppRole = 'admin' | 'editor' | 'viewer';

interface UserWithRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
  email?: string;
  full_name?: string;
}

interface UserManagementProps {
  currentUserId: string;
}

export const UserManagement = ({ currentUserId }: UserManagementProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<AppRole>('viewer');

  // Fetch all users with roles
  const { data: usersWithRoles, isLoading } = useQuery({
    queryKey: ['admin-users-roles'],
    queryFn: async () => {
      // First get all user roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*')
        .order('created_at', { ascending: false });

      if (rolesError) throw rolesError;

      // Then get profile info for each user
      const usersWithInfo: UserWithRole[] = [];
      
      for (const role of roles || []) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('email, full_name')
          .eq('user_id', role.user_id)
          .single();

        usersWithInfo.push({
          ...role,
          email: profile?.email || 'Email não disponível',
          full_name: profile?.full_name || undefined,
        });
      }

      return usersWithInfo;
    },
  });

  // Add user role mutation
  const addUserRoleMutation = useMutation({
    mutationFn: async ({ email, role }: { email: string; role: AppRole }) => {
      // First, we need to find the user by email in profiles
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('email', email)
        .single();

      if (profileError || !profile) {
        throw new Error('Usuário não encontrado. Certifique-se de que o email está cadastrado.');
      }

      // Check if user already has a role
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', profile.user_id)
        .single();

      if (existingRole) {
        throw new Error('Este usuário já possui um papel atribuído.');
      }

      // Add the role
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: profile.user_id,
          role: role,
          granted_by: currentUserId,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users-roles'] });
      toast({ title: 'Usuário adicionado com sucesso!' });
      setAddUserDialogOpen(false);
      setNewUserEmail('');
      setNewUserRole('viewer');
    },
    onError: (error: Error) => {
      toast({ 
        title: 'Erro ao adicionar usuário', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });

  // Update user role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: AppRole }) => {
      const { error } = await supabase
        .from('user_roles')
        .update({ role })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users-roles'] });
      toast({ title: 'Papel atualizado com sucesso!' });
    },
    onError: () => {
      toast({ title: 'Erro ao atualizar papel', variant: 'destructive' });
    },
  });

  // Delete user role mutation
  const deleteRoleMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users-roles'] });
      toast({ title: 'Usuário removido com sucesso!' });
    },
    onError: () => {
      toast({ title: 'Erro ao remover usuário', variant: 'destructive' });
    },
  });

  const handleAddUser = () => {
    if (!newUserEmail.trim()) {
      toast({ title: 'Digite o email do usuário', variant: 'destructive' });
      return;
    }
    addUserRoleMutation.mutate({ email: newUserEmail.trim(), role: newUserRole });
  };

  const getRoleBadgeVariant = (role: AppRole): 'default' | 'secondary' | 'outline' => {
    switch (role) {
      case 'admin': return 'default';
      case 'editor': return 'secondary';
      default: return 'outline';
    }
  };

  const getRoleIcon = (role: AppRole) => {
    switch (role) {
      case 'admin': return <Crown className="h-3 w-3 mr-1" />;
      case 'editor': return <Shield className="h-3 w-3 mr-1" />;
      default: return null;
    }
  };

  const getRoleLabel = (role: AppRole) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'editor': return 'Editor';
      default: return 'Visualizador';
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <UsersIcon className="h-5 w-5" />
            Gerenciar Usuários
          </CardTitle>
          <CardDescription>
            Adicione ou remova usuários e gerencie seus papéis de acesso
          </CardDescription>
        </div>
        
        <Dialog open={addUserDialogOpen} onOpenChange={setAddUserDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Usuário
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Novo Usuário</DialogTitle>
              <DialogDescription>
                Digite o email de um usuário já cadastrado para dar acesso ao painel
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email do usuário</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="usuario@exemplo.com"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="role">Papel</Label>
                <Select value={newUserRole} onValueChange={(v) => setNewUserRole(v as AppRole)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewer">Visualizador</SelectItem>
                    <SelectItem value="editor">Editor</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  • Visualizador: Apenas visualiza dados<br />
                  • Editor: Pode editar conteúdo<br />
                  • Administrador: Acesso total
                </p>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setAddUserDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddUser} disabled={addUserRoleMutation.isPending}>
                {addUserRoleMutation.isPending ? 'Adicionando...' : 'Adicionar'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Carregando usuários...
          </div>
        ) : !usersWithRoles?.length ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum usuário encontrado
          </div>
        ) : (
          <div className="space-y-3">
            {usersWithRoles.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 border rounded-lg bg-card"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">
                      {user.full_name || user.email}
                    </p>
                    {user.full_name && (
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Select
                    value={user.role}
                    onValueChange={(value) => updateRoleMutation.mutate({ id: user.id, role: value as AppRole })}
                    disabled={user.user_id === currentUserId}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue>
                        <Badge variant={getRoleBadgeVariant(user.role)} className="flex items-center">
                          {getRoleIcon(user.role)}
                          {getRoleLabel(user.role)}
                        </Badge>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="viewer">Visualizador</SelectItem>
                      <SelectItem value="editor">Editor</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {user.user_id !== currentUserId && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remover usuário?</AlertDialogTitle>
                          <AlertDialogDescription>
                            O usuário perderá acesso ao painel administrativo. 
                            Esta ação pode ser desfeita adicionando o usuário novamente.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteRoleMutation.mutate(user.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Remover
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
