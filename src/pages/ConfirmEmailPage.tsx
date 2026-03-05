import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Loader2, CheckCircle2, XCircle, Cloud } from 'lucide-react';
import { authApi } from '@/api/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

type Status = 'loading' | 'success' | 'error';

export default function ConfirmEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [status, setStatus] = useState<Status>('loading');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      return;
    }
    authApi
      .confirmEmail(token)
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'));
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-2 mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Cloud className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">CloudIaaS</h1>
        </div>

        <Card>
          <CardContent className="pt-6">
            {status === 'loading' && (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Подтверждаем email…</p>
              </div>
            )}

            {status === 'success' && (
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <CheckCircle2 className="h-12 w-12 text-green-500" />
                <p className="text-lg font-semibold">Email подтверждён!</p>
                <p className="text-sm text-muted-foreground">
                  Ваш аккаунт активен. Теперь вы можете войти.
                </p>
                <Button asChild className="mt-2 w-full">
                  <Link to="/login">Перейти ко входу</Link>
                </Button>
              </div>
            )}

            {status === 'error' && (
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <XCircle className="h-12 w-12 text-destructive" />
                <p className="text-lg font-semibold">Недействительная или устаревшая ссылка</p>
                <p className="text-sm text-muted-foreground">
                  Эта ссылка подтверждения больше недействительна. Пожалуйста, зарегистрируйтесь снова или обратитесь в поддержку.
                </p>
                <Button asChild variant="outline" className="mt-2 w-full">
                  <Link to="/register">Назад к регистрации</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
