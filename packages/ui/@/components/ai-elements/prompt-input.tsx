"use client";

import type { ComponentProps } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { ArrowUpIcon } from "lucide-react";
import { forwardRef } from "react";

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

export const PromptInputTextarea = forwardRef<
  HTMLTextAreaElement,
  PromptInputTextareaProps
>(({ className, onKeyDown, ...props }, ref) => (
  <Textarea
    className={cn(
      "min-h-[88px] max-h-[220px] resize-none border-0 bg-transparent p-2 shadow-none focus-visible:ring-0",
      className
    )}
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
    ref={ref}
    {...props}
  />
));

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
  <Button className={cn("h-8 w-8 rounded-full p-0", className)} size="icon-sm" type="submit" {...props}>
    {children ?? <ArrowUpIcon className="size-4" />}
  </Button>
);

