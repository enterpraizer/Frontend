import { Sparkles } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';

interface AISuggestionCardProps {
  vcpu: number;
  ram_mb: number;
  disk_gb: number;
  reasoning: string;
  confidence: number;
  onAccept: () => void;
  onDismiss: () => void;
}

const AISuggestionCard = ({
  vcpu,
  ram_mb,
  disk_gb,
  reasoning,
  confidence,
  onAccept,
  onDismiss,
}: AISuggestionCardProps) => {
  const confidencePct = Math.round(confidence * 100);

  return (
    <div className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300 rounded-xl overflow-hidden shadow-md">
      {/* Gradient header */}
      <div className="bg-gradient-to-r from-violet-500 to-indigo-600 px-4 py-3 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-white shrink-0" />
        <span className="text-sm font-semibold text-white tracking-wide">AI Recommendation</span>
      </div>

      {/* Body */}
      <div className="bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-950/40 dark:to-indigo-950/40 border border-t-0 border-violet-200 dark:border-violet-800 rounded-b-xl px-4 py-4 space-y-4">
        {/* Metric badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center rounded-full bg-white dark:bg-violet-900/50 border border-violet-200 dark:border-violet-700 px-3 py-1 text-xs font-semibold text-violet-700 dark:text-violet-200 shadow-sm">
            {vcpu} vCPU
          </span>
          <span className="inline-flex items-center rounded-full bg-white dark:bg-violet-900/50 border border-violet-200 dark:border-violet-700 px-3 py-1 text-xs font-semibold text-violet-700 dark:text-violet-200 shadow-sm">
            {ram_mb} MB RAM
          </span>
          <span className="inline-flex items-center rounded-full bg-white dark:bg-violet-900/50 border border-violet-200 dark:border-violet-700 px-3 py-1 text-xs font-semibold text-violet-700 dark:text-violet-200 shadow-sm">
            {disk_gb} GB Disk
          </span>
        </div>

        {/* Confidence bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-violet-600 dark:text-violet-400">
            <span>Уверенность</span>
            <span className="font-semibold">{confidencePct}%</span>
          </div>
          <Progress
            value={confidencePct}
            className="h-2 bg-violet-200 dark:bg-violet-800 [&>[data-radix-progress-indicator]]:bg-gradient-to-r [&>[data-radix-progress-indicator]]:from-violet-500 [&>[data-radix-progress-indicator]]:to-indigo-500"
          />
        </div>

        {/* Reasoning */}
        <p className="text-xs italic text-violet-700/80 dark:text-violet-300/80 leading-relaxed">
          "{reasoning}"
        </p>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <Button
            type="button"
            size="sm"
            className="flex-1 bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 text-white border-0 shadow-sm"
            onClick={onAccept}
          >
            Принять
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="flex-1 text-violet-600 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-900/30"
            onClick={onDismiss}
          >
            Игнорировать
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AISuggestionCard;

