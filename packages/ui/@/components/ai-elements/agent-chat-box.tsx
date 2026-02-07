"use client";

import type { UIMessage } from "ai";
import type { ReactNode } from "react";

import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@/components/ai-elements/reasoning";
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from "@/components/ai-elements/tool";
import { cn } from "@/lib/utils";

export interface AgentChatBoxProps {
  messages: UIMessage[];
  agentLabel?: string;
  className?: string;
  contentClassName?: string;
  emptyTitle?: string;
  emptyDescription?: string;
}

function isDataPart(type?: string): boolean {
  return typeof type === "string" && type.startsWith("data-");
}

function isToolPart(type?: string): boolean {
  return (
    type === "dynamic-tool" ||
    (typeof type === "string" && type.startsWith("tool-"))
  );
}

function asJson(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch (_error) {
    return String(value);
  }
}

function renderPart(part: any, index: number): ReactNode {
  const type = part?.type as string | undefined;

  if (type === "text") {
    return <MessageResponse key={`text-${index}`}>{part.text ?? ""}</MessageResponse>;
  }

  if (type === "reasoning") {
    const isStreaming = part?.state === "streaming";

    return (
      <Reasoning
        className="mb-0"
        defaultOpen={isStreaming}
        isStreaming={isStreaming}
        key={`reasoning-${index}`}
      >
        <ReasoningTrigger />
        <ReasoningContent>{part.text ?? ""}</ReasoningContent>
      </Reasoning>
    );
  }

  if (type === "source-url") {
    const href = part?.url;

    return (
      <a
        className="rounded-md border border-border bg-muted/50 px-3 py-2 text-sm hover:bg-muted"
        href={href}
        key={`source-url-${index}`}
        rel="noreferrer"
        target="_blank"
      >
        {part?.title ?? href ?? "Source"}
      </a>
    );
  }

  if (type === "source-document") {
    return (
      <div
        className="rounded-md border border-border bg-muted/50 px-3 py-2 text-sm"
        key={`source-document-${index}`}
      >
        <div className="font-medium">{part?.title ?? "Document"}</div>
        <div className="text-xs opacity-70">{part?.mediaType ?? part?.filename}</div>
      </div>
    );
  }

  if (type === "file") {
    const url = part?.url;
    const mediaType = part?.mediaType ?? "";

    if (typeof url === "string" && mediaType.startsWith("image/")) {
      return (
        <img
          alt={part?.filename ?? "file"}
          className="max-h-80 w-auto rounded-md border border-border"
          key={`file-image-${index}`}
          src={url}
        />
      );
    }

    if (typeof url === "string") {
      return (
        <a
          className="inline-flex rounded-md border border-border bg-muted/50 px-3 py-2 text-sm hover:bg-muted"
          href={url}
          key={`file-link-${index}`}
          rel="noreferrer"
          target="_blank"
        >
          {part?.filename ?? mediaType ?? "File"}
        </a>
      );
    }
  }

  if (type === "step-start") {
    return (
      <div className="my-1 flex items-center gap-2 opacity-60" key={`step-${index}`}>
        <div className="h-px flex-1 bg-border" />
        <div className="text-[10px] uppercase tracking-widest">Step</div>
        <div className="h-px flex-1 bg-border" />
      </div>
    );
  }

  if (isToolPart(type)) {
    const toolState = part?.state ?? "input-available";
    const toolOpen = toolState !== "output-available";

    return (
      <Tool defaultOpen={toolOpen} key={`${type ?? "tool"}-${index}`}>
        <ToolHeader
          state={toolState}
          title={part?.title}
          toolName={part?.toolName}
          type={type as any}
        />
        <ToolContent>
          <ToolInput input={part?.input} />
          <ToolOutput errorText={part?.errorText} output={part?.output} />
        </ToolContent>
      </Tool>
    );
  }

  if (isDataPart(type)) {
    return (
      <pre
        className="max-h-56 overflow-auto rounded-md border border-border bg-muted/50 p-2 text-xs"
        key={`${type ?? "part"}-${index}`}
      >
        {asJson(part)}
      </pre>
    );
  }

  return (
    <pre
      className="max-h-56 overflow-auto rounded-md border border-border bg-muted/50 p-2 text-xs"
      key={`${type ?? "part"}-${index}`}
    >
      {asJson(part)}
    </pre>
  );
}

export const AgentChatBox = ({
  messages,
  className,
  contentClassName,
  emptyTitle,
  emptyDescription,
}: AgentChatBoxProps) => {
  const chatMessages = Array.isArray(messages) ? messages : [];

  return (
    <Conversation className={cn("relative flex-1", className)}>
      <ConversationContent className={cn("gap-4 p-3", contentClassName)}>
        {chatMessages.length > 0 ? (
          chatMessages.map((message) => (
            <Message from={message.role} key={message.id}>
              <MessageContent>
                {(message.parts ?? []).map((part, idx) => renderPart(part, idx))}
              </MessageContent>
            </Message>
          ))
        ) : (
          <ConversationEmptyState
            description={emptyDescription ?? "Start the conversation below."}
            title={emptyTitle ?? "No messages yet"}
          />
        )}
      </ConversationContent>
      <ConversationScrollButton />
    </Conversation>
  );
};
