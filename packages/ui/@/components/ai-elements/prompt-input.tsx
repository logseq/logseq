"use client";

import type { ComponentProps } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { ArrowUpIcon } from "lucide-react";
import { forwardRef, useCallback, useLayoutEffect, useRef } from "react";

export type PromptInputProps = ComponentProps<"form">;

export const PromptInput = forwardRef<HTMLFormElement, PromptInputProps>(
  ({ className, ...props }, ref) => (
    <form
      className={cn(
        "rounded-xl border border-border bg-background p-2 shadow-sm",
        className
      )}
      ref={ref}
      {...props}
    />
  )
);

PromptInput.displayName = "PromptInput";

export type PromptInputTextareaProps = ComponentProps<typeof Textarea>;

const PROMPT_INPUT_TEXTAREA_MAX_HEIGHT = 220;

function autoResizeTextarea(
  textarea: HTMLTextAreaElement,
  maxHeight = PROMPT_INPUT_TEXTAREA_MAX_HEIGHT
): void {
  textarea.style.height = "auto";
  const nextHeight = Math.min(textarea.scrollHeight, maxHeight);
  textarea.style.height = `${nextHeight}px`;
  textarea.style.overflowY =
    textarea.scrollHeight > maxHeight ? "auto" : "hidden";
}

export const PromptInputTextarea = forwardRef<
  HTMLTextAreaElement,
  PromptInputTextareaProps
>(({ className, onInput, onKeyDown, rows, value, ...props }, ref) => {
  const innerRef = useRef<HTMLTextAreaElement | null>(null);

  const assignRef = useCallback(
    (node: HTMLTextAreaElement | null) => {
      innerRef.current = node;
      if (typeof ref === "function") {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    },
    [ref]
  );

  useLayoutEffect(() => {
    if (innerRef.current) {
      autoResizeTextarea(innerRef.current);
    }
  }, [value]);

  return (
    <Textarea
      className={cn(
        "min-h-0 max-h-[220px] resize-none overflow-y-hidden border-0 bg-transparent p-2 shadow-none focus-visible:ring-0",
        className
      )}
      onInput={(event) => {
        autoResizeTextarea(event.currentTarget);
        onInput?.(event);
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (event.defaultPrevented) {
          return;
        }

        const isComposing = event.nativeEvent.isComposing;
        if (isComposing) {
          return;
        }

        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault();
          event.currentTarget.form?.requestSubmit();
        }
      }}
      ref={assignRef}
      rows={rows ?? 1}
      value={value}
      {...props}
    />
  );
});

PromptInputTextarea.displayName = "PromptInputTextarea";

export type PromptInputToolbarProps = ComponentProps<"div">;

export const PromptInputToolbar = ({
  className,
  ...props
}: PromptInputToolbarProps) => (
  <div
    className={cn("flex items-center justify-between gap-2 px-1 pb-1", className)}
    {...props}
  />
);

export type PromptInputSubmitProps = ComponentProps<typeof Button>;

export const PromptInputSubmit = ({
  className,
  children,
  ...props
}: PromptInputSubmitProps) => (
  <Button className={cn("h-6 w-6 rounded-full p-0", className)} size="icon-sm" type="submit" {...props}>
    {children ?? <ArrowUpIcon className="size-3" />}
  </Button>
);
