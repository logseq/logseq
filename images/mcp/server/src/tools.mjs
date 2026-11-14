import { z } from "zod";
import { CliError, ednStringVector, runLogseqJson, runLogseqText } from "./cli.mjs";

const BLOCKED_GENERIC_COMMANDS = new Set(["login", "logout", "completion", "agent"]);

const graphParam = z.string().min(1).describe("Local graph name (as shown by list_local_graphs)");
const targetParams = {
  target_page: z.string().optional().describe("Insert under this page (created if missing)"),
  target_uuid: z.string().optional().describe("Insert relative to this block/page UUID"),
  target_id: z.number().int().positive().optional().describe("Insert relative to this db/id"),
  pos: z
    .enum(["first-child", "last-child", "sibling"])
    .optional()
    .describe("Position relative to the target (sibling requires target_uuid or target_id)"),
};
const tagMutationParams = {
  update_tags: z.array(z.string()).optional().describe("Tags to add (tags must already exist)"),
  update_properties: z
    .string()
    .optional()
    .describe('Properties to set as an EDN map, e.g. {"status" "done"}. Check logseq_help first.'),
  remove_tags: z.array(z.string()).optional().describe("Tags to remove"),
  remove_properties: z.array(z.string()).optional().describe("Property names to remove"),
};

const READ_ONLY = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false };
const WRITE = { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false };
const DESTRUCTIVE = { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: false };

function ok(data) {
  return {
    content: [{ type: "text", text: JSON.stringify(data ?? null, null, 2) }],
  };
}

function fail(error) {
  const payload =
    error instanceof CliError
      ? { error: { code: error.code, message: error.message, hint: error.hint } }
      : { error: { code: "internal-error", message: String(error?.message ?? error) } };
  return { isError: true, content: [{ type: "text", text: JSON.stringify(payload, null, 2) }] };
}

function invalid(message) {
  return new CliError(message, { code: "invalid-arguments" });
}

// `--flag=value` keeps values that start with "-" (e.g. Markdown bullets) from
// being parsed as options.
function opt(flag, value) {
  return `${flag}=${value}`;
}

function pushOpt(args, flag, value) {
  if (value === undefined || value === null || value === "") return;
  args.push(opt(flag, value));
}

function pushVector(args, flag, values) {
  if (values?.length) args.push(opt(flag, ednStringVector(values)));
}

function pushTarget(args, { target_page, target_uuid, target_id, pos }) {
  const targets = [target_page, target_uuid, target_id].filter((v) => v !== undefined);
  if (targets.length > 1) throw invalid("Provide at most one of target_page, target_uuid, target_id");
  pushOpt(args, "--target-page", target_page);
  pushOpt(args, "--target-uuid", target_uuid);
  pushOpt(args, "--target-id", target_id);
  pushOpt(args, "--pos", pos);
}

function pushMutations(args, input) {
  pushVector(args, "--update-tags", input.update_tags);
  pushOpt(args, "--update-properties", input.update_properties);
  pushVector(args, "--remove-tags", input.remove_tags);
  pushVector(args, "--remove-properties", input.remove_properties);
}

function exactlyOne(input, keys) {
  const present = keys.filter((key) => input[key] !== undefined);
  if (present.length !== 1) throw invalid(`Provide exactly one of ${keys.join(", ")}`);
  return present[0];
}

export function registerTools(server, manager) {
  const tool = (name, config, handler) => {
    server.registerTool(name, config, async (input) => {
      try {
        return ok(await handler(input ?? {}));
      } catch (error) {
        return fail(error);
      }
    });
  };

  const graphCommand = (graph, args, options) => {
    manager.assertReady(graph);
    return runLogseqJson([...args, opt("--graph", graph)], options);
  };

  // ---------------------------------------------------------------- graphs

  tool(
    "list_remote_graphs",
    {
      title: "List remote graphs",
      description: "List graphs available on the self-hosted Logseq sync server (includes graph-e2ee? flag).",
      annotations: READ_ONLY,
    },
    () => manager.remoteGraphs(),
  );

  tool(
    "list_local_graphs",
    {
      title: "List local graphs",
      description:
        "List graphs downloaded in this server, whether they are open (synced) and their sync state.",
      annotations: READ_ONLY,
    },
    () => manager.describeGraphs(),
  );

  tool(
    "open_graph",
    {
      title: "Open graph",
      description:
        "Download a remote graph (first time only) and start realtime sync for it. Must be called before " +
        "using a graph. Large graphs keep downloading in the background; poll list_local_graphs.",
      inputSchema: {
        graph: z.string().min(1).describe("Remote graph name (from list_remote_graphs)"),
        wait_seconds: z.number().int().min(0).max(110).optional().describe("How long to wait (default 25)"),
      },
      annotations: { ...WRITE, idempotentHint: true, openWorldHint: true },
    },
    ({ graph, wait_seconds }) => manager.openGraph(graph, (wait_seconds ?? 25) * 1000),
  );

  tool(
    "close_graph",
    {
      title: "Close graph",
      description: "Stop syncing a graph and stop its worker process. Optionally delete the local copy.",
      inputSchema: {
        graph: graphParam,
        remove_local: z.boolean().optional().describe("Also delete the local copy (remote is untouched)"),
      },
      annotations: DESTRUCTIVE,
    },
    ({ graph, remove_local }) => manager.closeGraph(graph, { removeLocal: Boolean(remove_local) }),
  );

  // ------------------------------------------------------------------ read

  tool(
    "search",
    {
      title: "Search graph",
      description: "Case-insensitive substring search over block titles, page names, properties or tags.",
      inputSchema: {
        graph: graphParam,
        text: z.string().min(1),
        type: z.enum(["block", "page", "property", "tag"]).optional().describe("Default: block"),
      },
      annotations: READ_ONLY,
    },
    ({ graph, text, type }) => graphCommand(graph, ["search", type ?? "block", opt("--content", text)]),
  );

  tool(
    "show",
    {
      title: "Show page or block tree",
      description: "Show the content tree of a page (by name) or a block (by uuid or db/id).",
      inputSchema: {
        graph: graphParam,
        page: z.string().optional(),
        uuid: z.string().optional(),
        id: z.number().int().positive().optional(),
        level: z.number().int().positive().optional().describe("Max depth of children"),
      },
      annotations: READ_ONLY,
    },
    (input) => {
      const selector = exactlyOne(input, ["page", "uuid", "id"]);
      const args = ["show", opt(`--${selector}`, input[selector])];
      pushOpt(args, "--level", input.level);
      return graphCommand(input.graph, args);
    },
  );

  tool(
    "list",
    {
      title: "List entities",
      description:
        "List pages, tags, properties, tasks, nodes or assets. kind=node requires tags or properties " +
        "(all-of semantics).",
      inputSchema: {
        graph: graphParam,
        kind: z.enum(["page", "tag", "property", "task", "node", "asset"]),
        limit: z.number().int().positive().optional(),
        offset: z.number().int().min(0).optional(),
        sort: z.string().optional().describe("Sort field, default updated-at"),
        order: z.enum(["asc", "desc"]).optional(),
        journal_only: z.boolean().optional().describe("kind=page only"),
        status: z.string().optional().describe("kind=task only"),
        priority: z.enum(["low", "medium", "high", "urgent"]).optional().describe("kind=task only"),
        content: z.string().optional().describe("kind=task only: content substring"),
        tags: z.array(z.string()).optional().describe("kind=node only"),
        properties: z.array(z.string()).optional().describe("kind=node only"),
      },
      annotations: READ_ONLY,
    },
    (input) => {
      const args = ["list", input.kind];
      pushOpt(args, "--limit", input.limit);
      pushOpt(args, "--offset", input.offset);
      pushOpt(args, "--sort", input.sort);
      pushOpt(args, "--order", input.order);
      if (input.journal_only) args.push("--journal-only");
      pushOpt(args, "--status", input.status);
      pushOpt(args, "--priority", input.priority);
      pushOpt(args, "--content", input.content);
      if (input.tags?.length) pushOpt(args, "--tags", input.tags.join(","));
      if (input.properties?.length) pushOpt(args, "--properties", input.properties.join(","));
      return graphCommand(input.graph, args);
    },
  );

  tool(
    "query",
    {
      title: "Datascript query",
      description:
        "Run a Datascript query (EDN) or a named query (see `query list` via logseq_cli). Built-in rules " +
        "are available by adding % to :in.",
      inputSchema: {
        graph: graphParam,
        query: z.string().optional().describe("EDN query, e.g. [:find [?title ...] :where [?e :block/title ?title]]"),
        name: z.string().optional().describe("Named query, e.g. recent-updated"),
        inputs: z.string().optional().describe("EDN vector of inputs, e.g. [30]"),
      },
      annotations: READ_ONLY,
    },
    (input) => {
      const selector = exactlyOne(input, ["query", "name"]);
      const args = ["query", opt(`--${selector}`, input[selector])];
      pushOpt(args, "--inputs", input.inputs);
      return graphCommand(input.graph, args);
    },
  );

  // ----------------------------------------------------------------- write

  tool(
    "insert_blocks",
    {
      title: "Insert blocks",
      description:
        "Create a block tree from Markdown bullets (indentation = children). Defaults to today's journal " +
        "when no target is given. `key:: value` lines set existing properties; [[Page]] and #tag create links.",
      inputSchema: {
        graph: graphParam,
        markdown: z.string().min(1).describe("e.g. '- Parent\\n  - Child\\n- Sibling'"),
        ...targetParams,
        update_tags: tagMutationParams.update_tags,
        update_properties: tagMutationParams.update_properties,
        dry_run: z.boolean().optional().describe("Return planned ops without writing"),
      },
      annotations: WRITE,
    },
    (input) => {
      const args = ["upsert", "block", opt("--blocks", input.markdown)];
      pushTarget(args, input);
      pushVector(args, "--update-tags", input.update_tags);
      pushOpt(args, "--update-properties", input.update_properties);
      if (input.dry_run) args.push("--dry-run");
      return graphCommand(input.graph, args);
    },
  );

  tool(
    "update_block",
    {
      title: "Update block",
      description: "Update an existing block's content, tags or properties, and/or move it to a new target.",
      inputSchema: {
        graph: graphParam,
        id: z.number().int().positive().optional(),
        uuid: z.string().optional(),
        content: z.string().optional().describe("New block content"),
        ...targetParams,
        ...tagMutationParams,
      },
      annotations: WRITE,
    },
    (input) => {
      const selector = exactlyOne(input, ["id", "uuid"]);
      const args = ["upsert", "block", opt(`--${selector}`, input[selector])];
      pushOpt(args, "--content", input.content);
      pushTarget(args, input);
      pushMutations(args, input);
      return graphCommand(input.graph, args);
    },
  );

  tool(
    "upsert_page",
    {
      title: "Create or update page",
      description: "Create a page by name, or update/rename a page by name or db/id, with tags and properties.",
      inputSchema: {
        graph: graphParam,
        page: z.string().optional(),
        id: z.number().int().positive().optional(),
        rename: z.string().optional().describe("New page name"),
        ...tagMutationParams,
      },
      annotations: WRITE,
    },
    (input) => {
      const selector = exactlyOne(input, ["page", "id"]);
      const args = ["upsert", "page", opt(`--${selector}`, input[selector])];
      pushOpt(args, "--rename", input.rename);
      pushMutations(args, input);
      return graphCommand(input.graph, args);
    },
  );

  tool(
    "upsert_task",
    {
      title: "Create or update task",
      description:
        "Create a task block (content), a task page (page), or update an existing node (id/uuid) as #Task. " +
        "Keep status markers like TODO/DONE out of content; use status instead.",
      inputSchema: {
        graph: graphParam,
        content: z.string().optional().describe("Create a task block with this content"),
        page: z.string().optional().describe("Create/update a task page"),
        id: z.number().int().positive().optional(),
        uuid: z.string().optional(),
        ...targetParams,
        status: z.string().optional().describe("e.g. todo, doing, done (validated against the graph)"),
        priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
        scheduled: z.string().optional().describe("Datetime"),
        deadline: z.string().optional().describe("Datetime"),
        clear: z
          .array(z.enum(["status", "priority", "scheduled", "deadline"]))
          .optional()
          .describe("Fields to clear"),
      },
      annotations: WRITE,
    },
    (input) => {
      const selector = exactlyOne(input, ["content", "page", "id", "uuid"]);
      const args = ["upsert", "task", opt(`--${selector}`, input[selector])];
      if (selector === "content") pushTarget(args, input);
      pushOpt(args, "--status", input.status);
      pushOpt(args, "--priority", input.priority);
      pushOpt(args, "--scheduled", input.scheduled);
      pushOpt(args, "--deadline", input.deadline);
      for (const field of input.clear ?? []) args.push(`--no-${field}`);
      return graphCommand(input.graph, args);
    },
  );

  tool(
    "remove",
    {
      title: "Remove entity",
      description: "Remove a block (id/uuid), page (page/id), tag (name/id) or property (name/id).",
      inputSchema: {
        graph: graphParam,
        kind: z.enum(["block", "page", "tag", "property"]),
        id: z.number().int().positive().optional(),
        uuid: z.string().optional().describe("kind=block only"),
        page: z.string().optional().describe("kind=page only"),
        name: z.string().optional().describe("kind=tag or kind=property only"),
      },
      annotations: DESTRUCTIVE,
    },
    (input) => {
      const selector = exactlyOne(input, ["id", "uuid", "page", "name"]);
      const args = ["remove", input.kind, opt(`--${selector}`, input[selector])];
      return graphCommand(input.graph, args);
    },
  );

  // --------------------------------------------------------------- generic

  tool(
    "logseq_cli",
    {
      title: "Run Logseq CLI command",
      description:
        "Run any other logseq CLI command with JSON output, e.g. ['upsert','tag','--name','project'] or " +
        "['graph','info']. Do not include --output. Use logseq_help to discover options.",
      inputSchema: {
        args: z.array(z.string()).min(1).describe("CLI arguments without the leading `logseq`"),
        graph: z.string().optional().describe("Adds --graph <graph> (graph must be open)"),
      },
      annotations: { ...DESTRUCTIVE, openWorldHint: true },
    },
    ({ args, graph }) => {
      if (BLOCKED_GENERIC_COMMANDS.has(args[0])) {
        throw invalid(`Command '${args[0]}' is managed by the server and cannot be run through MCP`);
      }
      if (args.includes("--output")) throw invalid("Do not pass --output; JSON output is always used");
      if (graph) return graphCommand(graph, args, { timeoutMs: 300_000 });
      return runLogseqJson(args, { timeoutMs: 300_000 });
    },
  );

  tool(
    "logseq_help",
    {
      title: "Logseq CLI help",
      description: "Show `--help` and runnable examples for a CLI command path, e.g. ['upsert','block'].",
      inputSchema: {
        command: z.array(z.string()).optional().describe("Command path; empty for top-level help"),
      },
      annotations: READ_ONLY,
    },
    async ({ command }) => {
      const path = command ?? [];
      const help = await runLogseqText([...path, "--help"]);
      const examples = path.length ? await runLogseqText(["example", ...path]).catch(() => "") : "";
      return { help, examples };
    },
  );

  // ------------------------------------------------------------- resources

  let skillText;
  server.registerResource(
    "logseq-cli-skill",
    "logseq://skill/logseq-cli",
    {
      title: "Logseq CLI skill",
      description: "Official guidance on how to use the Logseq CLI correctly (tags, tasks, block trees).",
      mimeType: "text/markdown",
    },
    async (uri) => {
      skillText ??= await runLogseqText(["skill", "show"]);
      return { contents: [{ uri: uri.href, mimeType: "text/markdown", text: skillText }] };
    },
  );
}

export const SERVER_INSTRUCTIONS = [
  "This server operates Logseq DB graphs through a headless Logseq CLI that stays synced with the user's",
  "self-hosted Logseq sync server. Workflow: list_remote_graphs -> open_graph (once per graph) -> use the",
  "read/write tools with the graph name. Prefer task tools for tasks, insert_blocks with Markdown bullets for",
  "structured content, and explicit update_tags instead of #hashtags in content. Tags must exist before",
  "being associated (create them with logseq_cli ['upsert','tag','--name','X']). Read the",
  "logseq://skill/logseq-cli resource for detailed CLI semantics.",
].join(" ");
