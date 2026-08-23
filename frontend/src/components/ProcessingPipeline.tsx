import React from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { ProcessingStep } from '../types';

interface ProcessingPipelineProps {
  steps: ProcessingStep[];
  currentStepIndex: number;
  filename: string;
  statusMessage?: string;
}

export const ProcessingPipeline: React.FC<ProcessingPipelineProps> = ({
  steps,
  currentStepIndex,
  filename,
  statusMessage,
}) => {
  return (
    <div className="w-full max-w-xl mx-auto my-10 p-6 rounded-xl bg-zinc-900 border border-zinc-800 shadow-md">
      
      {/* Header */}
      <div className="text-center space-y-1 mb-6">
        <h3 className="text-base font-semibold text-zinc-100">
          Analyzing document
        </h3>
        <p className="text-xs text-zinc-400 truncate max-w-sm mx-auto">
          {filename}
        </p>
      </div>

      {/* Steps list */}
      <div className="space-y-3">
        {steps.map((step, idx) => {
          const isDone = idx < currentStepIndex;
          const isActive = idx === currentStepIndex;
          const isPending = idx > currentStepIndex;

          return (
            <div
              key={step.id}
              className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                isActive
                  ? 'bg-zinc-850 border-zinc-700'
                  : isDone
                  ? 'bg-zinc-950/50 border-zinc-850'
                  : 'bg-transparent border-transparent opacity-40'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                    isDone
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : isActive
                      ? 'bg-emerald-600 text-white'
                      : 'bg-zinc-800 text-zinc-500'
                  }`}
                >
                  {isDone ? <CheckCircle2 className="h-4 w-4" /> : idx + 1}
                </div>

                <div className="text-left">
                  <p
                    className={`text-xs font-medium ${
                      isDone
                        ? 'text-zinc-300'
                        : isActive
                        ? 'text-white'
                        : 'text-zinc-500'
                    }`}
                  >
                    {step.title}
                  </p>
                  <p className="text-[11px] text-zinc-500">
                    {step.description}
                  </p>
                </div>
              </div>

              <div>
                {isActive && (
                  <Loader2 className="h-4 w-4 text-emerald-400 animate-spin" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {statusMessage && (
        <div className="mt-5 text-center text-xs text-zinc-400 font-mono">
          {statusMessage}
        </div>
      )}

    </div>
  );
};
