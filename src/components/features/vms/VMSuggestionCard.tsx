import { Bot, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { AISuggestion } from '@/types';

interface VMSuggestionCardProps {
  suggestion: AISuggestion;
  onAccept: () => void;
  onDismiss: () => void;
  isAccepting?: boolean;
  isDismissing?: boolean;
}

const VMSuggestionCard = ({
  suggestion,
  onAccept,
  onDismiss,
  isAccepting = false,
  isDismissing = false,
}: VMSuggestionCardProps) => {
  const confidencePct = Math.round(suggestion.confidence * 100);
  const isBusy = isAccepting || isDismissing;

  return (
    <div className="animate-in fade-in-0 slide-in-from-top-2 duration-300 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 p-4">
      <div className="flex items-start gap-3">
        {/* Robot icon */}
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400">
          <Bot className="h-4 w-4" />
        </div>

        <div className="flex-1 space-y-3 min-w-0">
          {/* Suggestion text + confidence badge */}
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm text-amber-900 dark:text-amber-100 leading-relaxed">
              {suggestion.suggestion_text}
            </p>
            <Badge className="shrink-0 bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 border border-amber-300 dark:border-amber-700 hover:bg-amber-100">
              Уверенность: {confidencePct}%
            </Badge>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className="bg-amber-500 hover:bg-amber-600 text-white border-0 shadow-sm"
              onClick={onAccept}
              disabled={isBusy}
            >
              {isAccepting && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              Применить
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30"
              onClick={onDismiss}
              disabled={isBusy}
            >
              {isDismissing && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              Отклонить
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VMSuggestionCard;
