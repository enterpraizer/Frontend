import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { Loader2, Cloud } from 'lucide-react';
import { registerSchema, type RegisterInput } from '@/lib/schemas/auth.schema';
import { authApi } from '@/api/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { getErrorMessage } from '@/lib/utils';

export default function RegisterPage() {
  const [apiError, setApiError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (data: RegisterInput) => {
    setApiError(null);
    try {
      await authApi.register({
        email: data.email,
        username: data.username,
        password: data.password,
      });
      setSuccess(true);
    } catch (err) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setApiError(detail ?? getErrorMessage(err));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center gap-2 mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Cloud className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">CloudIaaS</h1>
          <p className="text-sm text-muted-foreground">Создать новый аккаунт</p>
        </div>

        <Card>
          <CardContent className="pt-6">
            {success ? (
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600 text-2xl">
                  ✓
                </div>
                <p className="font-medium">Регистрация прошла успешно!</p>
                <p className="text-sm text-muted-foreground">
                  Проверьте почту для подтверждения аккаунта.
                </p>
                <Link to="/login" className="text-sm font-medium text-primary hover:underline mt-2">
                  Вернуться ко входу
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="email">Эл. почта</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    aria-invalid={!!errors.email}
                    {...register('email')}
                  />
                  {errors.email && (
                    <p className="text-xs text-destructive">{errors.email.message}</p>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="username">Логин</Label>
                  <Input
                    id="username"
                    type="text"
                    autoComplete="username"
                    placeholder="your_username"
                    aria-invalid={!!errors.username}
                    {...register('username')}
                  />
                  {errors.username && (
                    <p className="text-xs text-destructive">{errors.username.message}</p>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="password">Пароль</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="••••••••"
                    aria-invalid={!!errors.password}
                    {...register('password')}
                  />
                  {errors.password && (
                    <p className="text-xs text-destructive">{errors.password.message}</p>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="confirm_password">Подтвердите пароль</Label>
                  <Input
                    id="confirm_password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="••••••••"
                    aria-invalid={!!errors.confirm_password}
                    {...register('confirm_password')}
                  />
                  {errors.confirm_password && (
                    <p className="text-xs text-destructive">{errors.confirm_password.message}</p>
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

                <Button type="submit" disabled={isSubmitting} className="w-full mt-1">
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Создать аккаунт
                </Button>
              </form>
            )}

            {!success && (
              <p className="mt-5 text-center text-sm text-muted-foreground">
                Уже есть аккаунт?{' '}
                <Link to="/login" className="font-medium text-primary hover:underline">
                  Войти
                </Link>
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
