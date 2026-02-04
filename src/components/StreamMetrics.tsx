import { memo } from 'react';
import type { StreamStats } from '../types';

interface StreamMetricsProps {
  stats: StreamStats | null;
}

export const StreamMetrics = memo(({ stats }: StreamMetricsProps) => {
  if (!stats) return null;

  const { tokens, durationMs, firstTokenMs, modelId } = stats;
  const tokensPerSecond = durationMs ? ((tokens / durationMs) * 1000).toFixed(1) : '0';
  const ttft = firstTokenMs ? `${firstTokenMs.toFixed(0)}ms` : 'N/A';
  const totalTime = durationMs ? `${(durationMs / 1000).toFixed(2)}s` : '0s';

  return (
    <div className="px-6 py-2 text-xs text-gray-500 flex items-center gap-4 border-t border-zinc-800">
      <div>
        <span className="text-gray-600">Model:</span> <span className="text-gray-400 font-medium">{modelId}</span>
      </div>
      <div>
        <span className="text-gray-600">Tokens:</span> <span className="text-gray-400 font-medium">{tokens}</span>
      </div>
      <div>
        <span className="text-gray-600">Speed:</span> <span className="text-gray-400 font-medium">{tokensPerSecond} t/s</span>
      </div>
      <div>
        <span className="text-gray-600">TTFT:</span> <span className="text-gray-400 font-medium">{ttft}</span>
      </div>
      <div>
        <span className="text-gray-600">Duration:</span> <span className="text-gray-400 font-medium">{totalTime}</span>
      </div>
    </div>
  );
});

StreamMetrics.displayName = 'StreamMetrics';
