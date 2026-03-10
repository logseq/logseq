"use client";

import type { ComponentProps, ReactNode } from "react";

import { MessageResponse } from "@/components/ai-elements/message";
import { cn } from "@/lib/utils";
import { BrainIcon, ChevronDownIcon } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

interface ReasoningContextValue {
  isStreaming: boolean;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  duration: number | undefined;
}

const ReasoningContext = createContext<ReasoningContextValue | null>(null);

export const useReasoning = () => {
  const context = useContext(ReasoningContext);
  if (!context) {
    throw new Error("Reasoning components must be used within Reasoning");
  }

  return context;
};

export type ReasoningProps = Omit<ComponentProps<"details">, "onToggle"> & {
  isStreaming?: boolean;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  duration?: number;
};

const MS_IN_SECOND = 1000;

export const Reasoning = ({
  className,
  isStreaming = false,
  open,
  defaultOpen,
  onOpenChange,
  duration: durationProp,
  children,
  ...props
}: ReasoningProps) => {
  const isControlled = typeof open === "boolean";
  const [uncontrolledOpen, setUncontrolledOpen] = useState<boolean>(
    defaultOpen ?? isStreaming
  );
  const [derivedDuration, setDerivedDuration] = useState<number | undefined>(
    undefined
  );
  const startTsRef = useRef<number | null>(isStreaming ? Date.now() : null);

  const isOpen = isControlled ? (open as boolean) : uncontrolledOpen;

  const setIsOpen = useCallback(
    (nextOpen: boolean) => {
      if (!isControlled) {
        setUncontrolledOpen(nextOpen);
      }
      onOpenChange?.(nextOpen);
    },
    [isControlled, onOpenChange]
  );

  useEffect(() => {
    if (isStreaming) {
      if (startTsRef.current == null) {
        startTsRef.current = Date.now();
      }
      if (!isOpen) {
        setIsOpen(true);
      }
      return;
    }

    if (startTsRef.current != null) {
      const elapsed = Math.max(1, Math.ceil((Date.now() - startTsRef.current) / MS_IN_SECOND));
      setDerivedDuration(elapsed);
      startTsRef.current = null;
    }
  }, [isStreaming, isOpen, setIsOpen]);

  const contextValue = useMemo<ReasoningContextValue>(
    () => ({
      isStreaming,
      isOpen,
      setIsOpen,
      duration: durationProp ?? derivedDuration,
    }),
    [isStreaming, isOpen, setIsOpen, durationProp, derivedDuration]
  );

  return (
    <ReasoningContext.Provider value={contextValue}>
      <details
        className={cn("group not-prose mb-4 rounded-md border border-border bg-muted/50 p-2", className)}
        onToggle={(event) => {
          setIsOpen((event.currentTarget as HTMLDetailsElement).open);
        }}
        open={isOpen}
        {...props}
      >
        {children}
      </details>
    </ReasoningContext.Provider>
  );
};

export type ReasoningTriggerProps = ComponentProps<"summary"> & {
  getThinkingMessage?: (isStreaming: boolean, duration?: number) => ReactNode;
};

const defaultGetThinkingMessage = (isStreaming: boolean, duration?: number) => {
  if (isStreaming || duration == null) {
    return "Thinking...";
  }

  return `Thought for ${duration}s`;
};

export const ReasoningTrigger = ({
  className,
  children,
  getThinkingMessage = defaultGetThinkingMessage,
  ...props
}: ReasoningTriggerProps) => {
  const { isStreaming, isOpen, duration } = useReasoning();

  return (
    <summary
      className={cn(
        "flex cursor-pointer list-none items-center gap-2 text-xs font-medium uppercase tracking-wide opacity-80",
        "[&::-webkit-details-marker]:hidden",
        className
      )}
      {...props}
    >
      {children ?? (
        <>
          <BrainIcon className="size-3" />
          <span>{getThinkingMessage(isStreaming, duration)}</span>
          <ChevronDownIcon
            className={cn(
              "ml-auto size-3 transition-transform",
              isOpen ? "rotate-180" : "rotate-0"
            )}
          />
        </>
      )}
    </summary>
  );
};

export type ReasoningContentProps = ComponentProps<"div"> & {
  children: string;
};

export const ReasoningContent = ({
  className,
  children,
  ...props
}: ReasoningContentProps) => (
  <div className={cn("mt-2 text-sm", className)} {...props}>
    <MessageResponse>{children}</MessageResponse>
  </div>
);
