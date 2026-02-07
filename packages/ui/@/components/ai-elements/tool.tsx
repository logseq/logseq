"use client";

import type { DynamicToolUIPart, ToolUIPart } from "ai";
import type { ComponentProps, ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  CheckCircleIcon,
  ChevronDownIcon,
  CircleIcon,
  ClockIcon,
  WrenchIcon,
  XCircleIcon,
} from "lucide-react";
import { isValidElement } from "react";

export type ToolProps = ComponentProps<"details">;

export const Tool = ({ className, children, ...props }: ToolProps) => (
  <details
    className={cn(
      "group not-prose mb-4 w-full rounded-md border border-border bg-muted/30",
      className
    )}
    {...props}
  >
    {children}
  </details>
);

export type ToolPart = ToolUIPart | DynamicToolUIPart;

export type ToolHeaderProps = {
  title?: string;
  className?: string;
} & (
  | { type: ToolUIPart["type"]; state: ToolUIPart["state"]; toolName?: never }
  | {
      type: DynamicToolUIPart["type"];
      state: DynamicToolUIPart["state"];
      toolName: string;
    }
);

const statusLabels: Record<ToolPart["state"], string> = {
  "approval-requested": "Awaiting Approval",
  "approval-responded": "Responded",
  "input-available": "Running",
  "input-streaming": "Pending",
  "output-available": "Completed",
  "output-denied": "Denied",
  "output-error": "Error",
};

const statusIcons: Record<ToolPart["state"], ReactNode> = {
  "approval-requested": <ClockIcon className="size-3.5 text-yellow-600" />,
  "approval-responded": <CheckCircleIcon className="size-3.5 text-blue-600" />,
  "input-available": <ClockIcon className="size-3.5 animate-pulse" />,
  "input-streaming": <CircleIcon className="size-3.5" />,
  "output-available": <CheckCircleIcon className="size-3.5 text-green-600" />,
  "output-denied": <XCircleIcon className="size-3.5 text-orange-600" />,
  "output-error": <XCircleIcon className="size-3.5 text-red-600" />,
};

export const getStatusBadge = (status: ToolPart["state"]) => (
  <Badge className="gap-1 rounded-full text-[10px]" variant="secondary">
    {statusIcons[status]}
    {statusLabels[status]}
  </Badge>
);

export const ToolHeader = ({
  className,
  title,
  type,
  state,
  toolName,
  ...props
}: ToolHeaderProps) => {
  const derivedName =
    type === "dynamic-tool" ? toolName : type.split("-").slice(1).join("-");

  return (
    <summary
      className={cn(
        "flex cursor-pointer list-none items-center justify-between gap-3 p-3",
        "[&::-webkit-details-marker]:hidden",
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-2 text-sm">
        <WrenchIcon className="size-3 text-muted-foreground" />
        <span className="font-medium">{title ?? derivedName}</span>
        {getStatusBadge(state)}
      </div>
      <ChevronDownIcon className="size-3 text-muted-foreground transition-transform group-open:rotate-180" />
    </summary>
  );
};

export type ToolContentProps = ComponentProps<"div">;

export const ToolContent = ({
  className,
  children,
  ...props
}: ToolContentProps) => (
  <div className={cn("space-y-3 border-t border-border p-3", className)} {...props}>
    {children}
  </div>
);

export type ToolInputProps = ComponentProps<"div"> & {
  input: ToolPart["input"];
};

export const ToolInput = ({ className, input, ...props }: ToolInputProps) => {
  if (typeof input === "undefined") {
    return null;
  }

  return (
    <div className={cn("space-y-1.5", className)} {...props}>
      <h4 className="font-medium text-[10px] uppercase tracking-wide text-muted-foreground">
        Parameters
      </h4>
      <pre className="max-h-56 overflow-auto rounded-md bg-muted/70 p-2 text-xs">
        {JSON.stringify(input, null, 2)}
      </pre>
    </div>
  );
};

export type ToolOutputProps = ComponentProps<"div"> & {
  output: ToolPart["output"];
  errorText: ToolPart["errorText"];
};

export const ToolOutput = ({
  className,
  output,
  errorText,
  ...props
}: ToolOutputProps) => {
  if (!(output || errorText)) {
    return null;
  }

  let renderedOutput: ReactNode = null;

  if (typeof output === "object" && output != null && !isValidElement(output)) {
    renderedOutput = (
      <pre className="max-h-56 overflow-auto rounded-md bg-muted/70 p-2 text-xs">
        {JSON.stringify(output, null, 2)}
      </pre>
    );
  } else if (typeof output === "string") {
    renderedOutput = (
      <pre className="max-h-56 overflow-auto rounded-md bg-muted/70 p-2 text-xs">
        {output}
      </pre>
    );
  } else if (output != null) {
    renderedOutput = <div className="text-xs">{output as ReactNode}</div>;
  }

  return (
    <div className={cn("space-y-1.5", className)} {...props}>
      <h4 className="font-medium text-[10px] uppercase tracking-wide text-muted-foreground">
        {errorText ? "Error" : "Result"}
      </h4>
      {errorText ? (
        <div className="rounded-md bg-destructive/10 p-2 text-xs text-destructive">
          {errorText}
        </div>
      ) : null}
      {renderedOutput}
    </div>
  );
};
