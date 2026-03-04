import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { Loader2, Mail, User2, Shield, Building2, AlertCircle, Calendar } from 'lucide-react';

import { toast } from 'sonner';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import UserAvatar from '@/components/features/users/UserAvatar';
import QuotaSummaryCard from '@/components/features/quotas/QuotaSummaryCard';

import { profileSchema, changePasswordSchema } from '@/lib/schemas/profile.schema';
import type { ProfileFormValues, ChangePasswordFormValues } from '@/lib/schemas/profile.schema';

import { useAuthStore } from '@/store/authStore';
import { useResourceUsage } from '@/hooks/useDashboard';
import { useQuota } from '@/hooks/useQuotas';
import { usersApi } from '@/api/users';
import { authApi } from '@/api/auth';

// ─── Tab 1: Account ──────────────────────────────────────────────────────────

const AccountTab = () => {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: user?.first_name ?? '',
      last_name: user?.last_name ?? '',
      avatar_url: user?.avatar_url ?? '',
    },
  });

  useEffect(() => {
    if (user) {
      reset({
        first_name: user.first_name ?? '',
        last_name: user.last_name ?? '',
        avatar_url: user.avatar_url ?? '',
      });
    }
  }, [user, reset]);

  const onSubmit = async (values: ProfileFormValues) => {
    if (!user) return;
    try {
      const updated = await usersApi.updateProfile(user.id, {
        first_name: values.first_name || undefined,
        last_name: values.last_name || undefined,
        avatar_url: values.avatar_url || undefined,
      });
      setUser(updated);
      toast.success('Profile updated');
    } catch {
      toast.error('Failed to update profile');
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* ── Identity ────────────────────────────────────────────────────── */}
      <Card>
        <CardContent className="flex items-center gap-5 pt-6">
          <UserAvatar user={user} size="lg" />
          <div className="space-y-1">
            <p className="text-lg font-semibold">
              {user.first_name && user.last_name
                ? `${user.first_name} ${user.last_name}`
                : user.username}
            </p>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Mail className="h-3.5 w-3.5" />
              {user.email}
            </div>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <User2 className="h-3.5 w-3.5" />
              @{user.username}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Badge
                className={
                  user.role === 'admin'
                    ? 'bg-violet-100 text-violet-700 border-violet-200'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }
              >
                <Shield className="mr-1 h-3 w-3" />
                {user.role}
              </Badge>
              {user.is_active && (
                <Badge className="bg-green-100 text-green-700 border-green-200">Active</Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Edit form ───────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Edit Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="first_name">First Name</Label>
                <Input id="first_name" placeholder="Jane" {...register('first_name')} />
                {errors.first_name && (
                  <p className="text-xs text-destructive">{errors.first_name.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="last_name">Last Name</Label>
                <Input id="last_name" placeholder="Doe" {...register('last_name')} />
                {errors.last_name && (
                  <p className="text-xs text-destructive">{errors.last_name.message}</p>
                )}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="avatar_url">Avatar URL</Label>
              <Input
                id="avatar_url"
                type="url"
                placeholder="https://example.com/avatar.png"
                {...register('avatar_url')}
              />
              {errors.avatar_url && (
                <p className="text-xs text-destructive">{errors.avatar_url.message}</p>
              )}
            </div>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</>
              ) : (
                'Save Changes'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

// ─── Tab 2: Workspace ─────────────────────────────────────────────────────────

const WorkspaceTab = () => {
  const user = useAuthStore((s) => s.user);
  const { data: usage } = useResourceUsage();
  const { data: quota } = useQuota();

  const quotaRows = quota && usage
    ? [
        {
          resource: 'vCPU',
          limit: `${quota.max_vcpu} cores`,
          used: `${usage.vcpu.used} cores`,
          pct: usage.vcpu.pct,
        },
        {
          resource: 'RAM',
          limit: `${Math.round(quota.max_ram_mb / 1024)} GB`,
          used: `${Math.round(usage.ram_mb.used / 1024)} GB`,
          pct: usage.ram_mb.pct,
        },
        {
          resource: 'Disk',
          limit: `${quota.max_disk_gb} GB`,
          used: `${usage.disk_gb.used} GB`,
          pct: usage.disk_gb.pct,
        },
        {
          resource: 'VMs',
          limit: `${quota.max_vms}`,
          used: `${usage.vms.used}`,
          pct: usage.vms.pct,
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Tenant info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Workspace
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">Tenant ID</p>
              <code className="text-xs bg-muted px-2 py-1 rounded">{user?.tenant_id ?? '—'}</code>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">Member Since</p>
              <span className="flex items-center gap-1.5 text-sm">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                {/* tenant created_at not in user object, show user object placeholder */}
                Active
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage gauges */}
      {usage && <QuotaSummaryCard usage={usage} title="Current Usage" />}

      {/* Quota limits table */}
      {quotaRows.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quota Limits</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Resource</TableHead>
                  <TableHead>Limit</TableHead>
                  <TableHead>Used</TableHead>
                  <TableHead>Utilization</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotaRows.map((row) => (
                  <TableRow key={row.resource}>
                    <TableCell className="font-medium">{row.resource}</TableCell>
                    <TableCell>{row.limit}</TableCell>
                    <TableCell>{row.used}</TableCell>
                    <TableCell>
                      <span
                        className={
                          row.pct >= 100
                            ? 'text-destructive font-semibold'
                            : row.pct >= 85
                            ? 'text-yellow-600 font-medium'
                            : 'text-green-600'
                        }
                      >
                        {row.pct}%
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Upgrade section */}
      <Card className="border-dashed">
        <CardContent className="flex items-start gap-4 pt-6">
          <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
          <div>
            <p className="font-medium text-sm">Need more resources?</p>
            <p className="text-sm text-muted-foreground mt-1">
              Contact your administrator to upgrade your quota limits.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// ─── Tab 3: Security ─────────────────────────────────────────────────────────

const SecurityTab = () => {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
  });

  const onSubmit = async (values: ChangePasswordFormValues) => {
    try {
      await authApi.changePassword({
        old_password: values.old_password,
        new_password: values.new_password,
      });
      toast.success("Password changed. You'll be logged out.");
      reset();
      setTimeout(() => {
        logout();
        navigate('/login');
      }, 2000);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      toast.error(e?.response?.data?.detail ?? 'Failed to change password');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Change Password</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-md">
            <div className="space-y-1.5">
              <Label htmlFor="old_password">Current Password</Label>
              <Input
                id="old_password"
                type="password"
                autoComplete="current-password"
                {...register('old_password')}
              />
              {errors.old_password && (
                <p className="text-xs text-destructive">{errors.old_password.message}</p>
              )}
            </div>
            <Separator />
            <div className="space-y-1.5">
              <Label htmlFor="new_password">New Password</Label>
              <Input
                id="new_password"
                type="password"
                autoComplete="new-password"
                {...register('new_password')}
              />
              {errors.new_password && (
                <p className="text-xs text-destructive">{errors.new_password.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm_new_password">Confirm New Password</Label>
              <Input
                id="confirm_new_password"
                type="password"
                autoComplete="new-password"
                {...register('confirm_new_password')}
              />
              {errors.confirm_new_password && (
                <p className="text-xs text-destructive">{errors.confirm_new_password.message}</p>
              )}
            </div>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Updating…</>
              ) : (
                'Update Password'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────

const ProfilePage = () => (
  <div className="max-w-3xl space-y-2">
    <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
    <p className="text-muted-foreground text-sm">Manage your account, workspace, and security settings.</p>
    <div className="pt-2">
      <Tabs defaultValue="account">
        <TabsList className="mb-6">
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="workspace">Workspace</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>
        <TabsContent value="account"><AccountTab /></TabsContent>
        <TabsContent value="workspace"><WorkspaceTab /></TabsContent>
        <TabsContent value="security"><SecurityTab /></TabsContent>
      </Tabs>
    </div>
  </div>
);

export default ProfilePage;
