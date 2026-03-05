import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { Loader2, Cloud } from 'lucide-react';
import { tenantSchema, type TenantInput } from '@/lib/schemas/auth.schema';
import { authApi } from '@/api/auth';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { getErrorMessage } from '@/lib/utils';

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { setTokens, setUser } = useAuthStore();
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TenantInput>({ resolver: zodResolver(tenantSchema) });

  const onSubmit = async (data: TenantInput) => {
    setApiError(null);
    try {
      const tokens = await authApi.createTenant(data.name);
      setTokens(tokens);
      // Fetch fresh user profile and merge tenant_id from the new tokens
      const user = await authApi.me();
      // Belt-and-suspenders: ensure tenant_id is set even if /me lags behind JWT reissue
      setUser({ ...user, tenant_id: user.tenant_id ?? tokens.tenant_id });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setApiError(detail ?? getErrorMessage(err));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="flex flex-col items-center gap-3 mb-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
            <Cloud className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Добро пожаловать в CloudIaaS!</h1>
          <p className="text-muted-foreground max-w-xs">
            Давайте настроим ваше рабочее пространство. Вы всегда сможете изменить название позже.
          </p>
        </div>

        <Card className="shadow-md">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="name" className="text-base">
                  Название рабочего пространства
                </Label>
                <Input
                  id="name"
                  type="text"
                  autoFocus
                  placeholder="например: Acme Corp, Мой Проект…"
                  className="h-11 text-base"
                  aria-invalid={!!errors.name}
                  {...register('name')}
                />
                {errors.name ? (
                  <p className="text-xs text-destructive">{errors.name.message}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Это будет название вашего рабочего пространства (tenant).
                  </p>
                )}
              </div>

              {apiError && (
                <div
                  role="alert"
                  className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive"
                >
                  {apiError}
                </div>
              )}

              <Button type="submit" disabled={isSubmitting} size="lg" className="w-full">
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Создать рабочее пространство
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
