"use client";

import { cn } from "@/lib/utils";
import type { FormEvent } from "react";
import {
  PromptInput,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
} from "@/components/ai-elements/prompt-input";

export interface AgentChatPromptInputProps {
  value: string;
  onValueChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
  busy?: boolean;
  className?: string;
  placeholder?: string;
  hint?: string;
}

export const AgentChatPromptInput = ({
  value,
  onValueChange,
  onSend,
  disabled,
  busy,
  className,
  placeholder,
  hint,
}: AgentChatPromptInputProps) => {
  const canSend = !disabled && !busy && value.trim().length > 0;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSend) {
      return;
    }
    onSend();
  };

  return (
    <PromptInput className={cn("mt-4", className)} onSubmit={handleSubmit}>
      <PromptInputTextarea
        disabled={disabled}
        onChange={(event) => {
          onValueChange(event.target.value);
        }}
        placeholder={placeholder}
        value={value}
      />
      <PromptInputToolbar>
        <div className="text-xs opacity-60">
          {hint ?? "Enter to send, Shift+Enter for newline"}
        </div>
        <div className="flex items-center gap-2">
          {busy ? <div className="text-xs opacity-70">Thinking...</div> : null}
          <PromptInputSubmit disabled={!canSend} />
        </div>
      </PromptInputToolbar>
    </PromptInput>
  );
};

