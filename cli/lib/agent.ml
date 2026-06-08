type parsed = Parsed_bridge

type action =
  | Agent_bridge of { repo : Cli_primitive.repo; graph : Cli_primitive.graph }

type routable_reason =
  | Missing_stable_uuid
  | Missing_task_tag
  | Not_todo
  | Assignee_mismatch
  | Already_routed

type routable_decision = Routable | Not_routable of routable_reason
type template_kind = Task | Comment

type prompt_template = {
  kind : template_kind;
  body : string;
  required_vars : string list;
  allowed_vars : string list;
}

type bridge_result = {
  mode : Cli_primitive.keyword;
  graph : Cli_primitive.graph;
  agent_name : string;
  routed : Melange_edn.any list;
}

type routed_task = { block : Melange_edn.any; session : string option }
type prompt_templates = { task : string; comment : string }
type inherited_session = { parent_block_uuid : string; session_id : string }

let default_master_prompt =
  String.concat "\n"
    [
      "# AgentBridge Master Agent";
      "";
      "## Role";
      "You are the graph-scoped master agent for Logseq AgentBridge.";
      "Classify incoming work and decide how to dispatch subagents.";
      "";
      "## Graph Safety";
      "Do not operate outside the target graph.";
      "Only the master agent may write task results back into the target graph.";
      "Subagents may read graph context but must not write graph content.";
      "When dispatching a subagent for a task, write the subagent Codex \
       session id to the task block's `:logseq.property.agent/session-id` \
       property.";
    ]

let graph_scope_line = "Do not operate outside the target graph."
let task_result_line = "Write task results back into the graph."

let task_finish_reaction_line =
  "When the task or subagent finishes, remove the `eyes` reaction from the \
   task block whether it succeeded or failed."

let comment_completion_line = "Complete the request from the mentioned comment."

let graph_report_lines =
  [
    "If the target graph is sync-enabled, make sure it is synced after writing \
     back to the graph.";
    "Keep the report short when possible.";
    "Report blockers only if there is a blocker.";
    "Report root cause and Steps to verify only for bug fixes.";
  ]

let comment_reply_instruction_lines =
  [
    "Reply instructions:";
    "For a short reply, append a comment after the requesting comment.";
    "For a long reply, write a normal block tree after the comments area and \
     append a comment that references that tree.";
    "When referencing result blocks in DB graphs, reference result blocks with \
     [[block-uuid]], not ((block-uuid)).";
    "If the request is blocked or fails, make that clear in the reply.";
  ]

let default_task_prompt_template =
  String.concat "\n"
    ([
       "You are handling a Logseq AgentBridge task.";
       "";
       "Graph: {{graph}}";
       "Block UUID: {{block-uuid}}";
       "AgentBridge name: {{agent-name}}";
       "";
       graph_scope_line;
       task_result_line;
       task_finish_reaction_line;
     ]
    @ graph_report_lines
    @ [ ""; "Task block tree:"; "{{task-block-tree}}" ])

let default_comment_prompt_template =
  String.concat "\n"
    ([
       "You are handling a Logseq AgentBridge comment request.";
       "";
       "Graph: {{graph}}";
       "Comment UUID: {{comment-uuid}}";
       "AgentBridge name: {{agent-name}}";
       "";
       graph_scope_line;
       comment_completion_line;
     ]
    @ graph_report_lines
    @ [
        "";
        "Comment target context:";
        "{{comment-target-context}}";
        "";
        "Comment thread context:";
        "{{comment-thread-context}}";
        "";
        "Requesting comment:";
        "{{requesting-comment}}";
        "";
      ]
    @ comment_reply_instruction_lines)

let trim_non_empty value =
  let value = String.trim value in
  if value = "" then None else Some value

let value_key_matches key value =
  match Edn_util.as_string_like value with
  | Some k -> k = key || k = ":" ^ key
  | None -> false

let map_contains key value =
  match Edn_util.as_map value with
  | Some fields -> List.exists (fun (k, _) -> value_key_matches key k) fields
  | None -> false

let resolve_agent_name config hostname =
  let configured =
    Option.bind config.Cli_config.raw_file_config (fun value ->
        Edn_util.get_string value ":agent-name")
  in
  let configured_present =
    match config.raw_file_config with
    | Some value -> map_contains ":agent-name" value
    | None -> false
  in
  match (configured_present, Option.bind configured trim_non_empty) with
  | true, Some agent_name -> Ok agent_name
  | true, None ->
      Error
        (Error.make
           (Edn_util.keyword_t "agent-name-invalid")
           "agent-name in cli.edn must be a non-empty string")
  | false, _ -> (
      match Option.bind hostname trim_non_empty with
      | Some agent_name -> Ok agent_name
      | None -> (
          match trim_non_empty (Cli_platform.hostname ()) with
          | Some agent_name -> Ok agent_name
          | None ->
              Error
                (Error.make
                   (Edn_util.keyword_t "agent-name-invalid")
                   "agent-name cannot be resolved from cli.edn or hostname")))

let value_list = function
  | Some value -> Option.value (Edn_util.as_seq value) ~default:[]
  | _ -> []

let ident_value value =
  match Edn_util.as_string_like value with
  | Some ident -> Some ident
  | None ->
      if Option.is_some (Edn_util.as_map value) then
        Edn_util.get_string value ":db/ident"
      else None

let has_task_tag raw =
  value_list (Edn_util.get raw ":block/tags")
  |> List.exists (fun tag ->
      ident_value tag = Some ":logseq.class/Task"
      || ident_value tag = Some "logseq.class/Task")

let status_ident raw =
  match Edn_util.get raw ":logseq.property/status" with
  | Some value -> ident_value value
  | None -> None

let assignee_values raw =
  value_list (Edn_util.get raw ":logseq.property/assignee")
  |> List.filter_map (fun value ->
      Option.bind (Edn_util.get_string value ":block/title") trim_non_empty)

let routable_task_decision entity ~agent_name =
  let raw = entity.Entity.raw in
  if Option.is_none (Edn_util.get raw ":block/uuid") then
    Not_routable Missing_stable_uuid
  else if not (has_task_tag raw) then Not_routable Missing_task_tag
  else if status_ident raw <> Some ":logseq.property/status.todo" then
    Not_routable Not_todo
  else if not (List.mem agent_name (assignee_values raw)) then
    Not_routable Assignee_mismatch
  else if Option.is_some (Edn_util.get raw ":logseq.property.agent/session-id")
  then Not_routable Already_routed
  else Routable

let is_var_char = function
  | 'A' .. 'Z' | 'a' .. 'z' | '0' .. '9' | '-' -> true
  | _ -> false

let valid_var_name value =
  String.length value > 0 && String.for_all is_var_char value

let unique values =
  let rec loop seen = function
    | [] -> List.rev seen
    | value :: rest when List.mem value seen -> loop seen rest
    | value :: rest -> loop (value :: seen) rest
  in
  loop [] values

let template_vars body =
  let len = String.length body in
  let rec loop acc index =
    if index + 3 >= len then unique (List.rev acc)
    else if body.[index] = '{' && body.[index + 1] = '{' then
      match String.index_from_opt body (index + 2) '}' with
      | Some close when close + 1 < len && body.[close + 1] = '}' ->
          let name = String.sub body (index + 2) (close - index - 2) in
          let quoted =
            index > 0
            && body.[index - 1] = '\''
            && close + 2 < len
            && body.[close + 2] = '\''
          in
          let acc =
            if (not quoted) && valid_var_name name then name :: acc else acc
          in
          loop acc (close + 2)
      | _ -> loop acc (index + 2)
    else loop acc (index + 1)
  in
  loop [] 0

let list_diff xs ys = List.filter (fun x -> not (List.mem x ys)) xs

let validate_prompt_template template =
  if String.trim template.body = "" then
    Error
      (Error.make
         (Edn_util.keyword_t "missing-template-code-block")
         "agent bridge prompt template code block is missing")
  else
    let vars = template_vars template.body in
    match list_diff vars template.allowed_vars with
    | _ :: _ ->
        Error
          (Error.make
             (Edn_util.keyword_t "unknown-template-vars")
             "agent bridge prompt template has unknown variables")
    | [] -> (
        match list_diff template.required_vars vars with
        | _ :: _ ->
            Error
              (Error.make
                 (Edn_util.keyword_t "missing-template-vars")
                 "agent bridge prompt template is missing required variables")
        | [] -> Ok ())

let assoc_string key pairs =
  List.find_map (fun (k, v) -> if k = key then Some v else None) pairs

let render_prompt_template template vars =
  Error.bind (validate_prompt_template template) (fun () ->
      let len = String.length template.body in
      let buffer = Buffer.create (len + 32) in
      let rec loop index =
        if index >= len then Ok (Buffer.contents buffer)
        else if
          index + 3 < len
          && template.body.[index] = '{'
          && template.body.[index + 1] = '{'
        then (
          match String.index_from_opt template.body (index + 2) '}' with
          | Some close when close + 1 < len && template.body.[close + 1] = '}'
            ->
              let name =
                String.sub template.body (index + 2) (close - index - 2)
              in
              if valid_var_name name then
                match assoc_string name vars with
                | Some value ->
                    Buffer.add_string buffer value;
                    loop (close + 2)
                | None ->
                    Error
                      (Error.make
                         (Edn_util.keyword_t "agent-prompt-template-var-missing")
                         "agent bridge prompt template var has no value")
              else (
                Buffer.add_string buffer "{{";
                loop (index + 2))
          | _ ->
              Buffer.add_char buffer template.body.[index];
              loop (index + 1))
        else (
          Buffer.add_char buffer template.body.[index];
          loop (index + 1))
      in
      loop 0)

let raw_config_string config key =
  Option.bind config.Cli_config.raw_file_config (fun value ->
      Edn_util.get_string value key)

let raw_config_bool config key =
  Option.bind config.Cli_config.raw_file_config (fun value ->
      Edn_util.get_bool value key)

let codex_bin config =
  Option.value (raw_config_string config ":codex-bin") ~default:"codex"

let agent_bridge_process_once config =
  Option.value
    (raw_config_bool config ":agent-bridge-process-once?")
    ~default:false

let codex_command_prefix config =
  [ codex_bin config; "--sandbox"; "danger-full-access"; "exec" ]

let build_codex_command config prompt =
  codex_command_prefix config @ [ "--json"; "--skip-git-repo-check"; prompt ]

let build_codex_resume_command config session_id prompt =
  codex_command_prefix config
  @ [ "resume"; "--json"; "--skip-git-repo-check"; session_id; prompt ]

let shell_env () = Cli_unix.environment ()

let run_command_capture command =
  match command with
  | [] -> { Cli_unix.status = 1; stdout = ""; stderr = "missing command" }
  | bin :: args -> Cli_unix.run_process_capture bin args (shell_env ())

let start_command_capture_session_line command =
  match command with
  | [] -> { Cli_unix.status = 1; stdout = ""; stderr = "missing command" }
  | bin :: args ->
      Cli_unix.start_process_capture_session_line bin args (shell_env ())

let codex_available config =
  let result = run_command_capture [ codex_bin config; "--version" ] in
  result.Cli_unix.status = 0

let parse_codex_session_id stdout =
  stdout |> String.split_on_char '\n'
  |> List.find_map (fun line ->
      try
        match Json_util.object_of_json_string line with
        | None -> None
        | Some object_ -> (
            match
              [ "session-id"; "session_id"; "thread-id"; "thread_id" ]
              |> List.find_map (Json_util.string_field object_)
            with
            | Some session_id -> Some session_id
            | None ->
                [
                  ("session", "id");
                  ("session", "session-id");
                  ("session", "session_id");
                  ("thread", "id");
                  ("thread", "thread-id");
                  ("thread", "thread_id");
                ]
                |> List.find_map (fun (object_field, nested_field) ->
                    Json_util.nested_string_field object_ object_field
                      nested_field))
      with _ -> None)

let start_codex config command =
  let result = start_command_capture_session_line command in
  if result.Cli_unix.status <> 0 then
    Error
      (Error.make
         (Edn_util.keyword_t "codex-start-failed")
         ("codex exited before startup completed: " ^ result.Cli_unix.stderr))
  else
    match parse_codex_session_id result.Cli_unix.stdout with
    | Some session when String.trim session <> "" -> Ok session
    | _ ->
        Error
          (Error.make
             (Edn_util.keyword_t "codex-session-id-missing")
             "codex exited before reporting a session id")

let ensure_master_session config master_prompt =
  start_codex config (build_codex_command config master_prompt)

let block_uuid value = Edn_util.get_string value ":block/uuid"

let block_title value =
  Option.value (Edn_util.get_string value ":block/title") ~default:""

let project_dir_line config =
  match config.Cli_config.project_dir with
  | Some value when String.trim value <> "" -> [ "Project directory: " ^ value ]
  | _ -> []

let inherited_task_session_lines = function
  | None -> []
  | Some inherited ->
      [
        "";
        "Inherited parent task UUID: " ^ inherited.parent_block_uuid;
        "Inherited subagent session id: " ^ inherited.session_id;
        "Continue this child task in the inherited subagent session instead of \
         launching a new subagent.";
      ]

let build_master_task_dispatch_prompt config ~graph ~agent_name
    ?inherited_session ?tree_text block =
  let uuid = Option.value (block_uuid block) ~default:"" in
  String.concat "\n"
    ([
       "You are handling a Logseq AgentBridge master dispatch request.";
       "";
       "Request kind: task";
       "Graph: " ^ graph;
       "AgentBridge name: " ^ agent_name;
     ]
    @ project_dir_line config
    @ [
        "";
        graph_scope_line;
        "Only the master agent may write task results back into the target \
         graph.";
        "Subagents may read graph context but must not write graph content.";
        "Route this request according to the master prompt policy.";
        "After launching the subagent with `codex exec`, write that subagent \
         session id to the task block's `:logseq.property.agent/session-id` \
         property.";
        "";
        "Write task results back into the graph.";
        task_finish_reaction_line;
      ]
    @ graph_report_lines
    @ [ ""; "Block UUID: " ^ uuid; "" ]
    @ inherited_task_session_lines inherited_session
    @ [
        "";
        "Task block tree:";
        Option.value tree_text ~default:(block_title block);
      ])

let dispatch_task_to_master config ~graph ~agent_name ~master_session
    ?inherited_session ?tree_text block =
  let prompt =
    build_master_task_dispatch_prompt config ~graph ~agent_name
      ?inherited_session ?tree_text block
  in
  start_codex config (build_codex_resume_command config master_session prompt)

let build_master_comment_dispatch_prompt config ~graph ~agent_name
    ~comment_block ~target_tree_texts ~comments_area_tree_text
    ~comment_tree_text =
  let uuid = Option.value (block_uuid comment_block) ~default:"" in
  String.concat "\n"
    ([
       "You are handling a Logseq AgentBridge master dispatch request.";
       "";
       "Request kind: comment";
       "Graph: " ^ graph;
       "AgentBridge name: " ^ agent_name;
     ]
    @ project_dir_line config
    @ [ ""; graph_scope_line; comment_completion_line ]
    @ graph_report_lines @ [ "" ] @ comment_reply_instruction_lines
    @ [
        "";
        "Comment UUID: " ^ uuid;
        "";
        "Comment target context:";
        String.concat "\n"
          (List.filter (fun value -> String.trim value <> "") target_tree_texts);
        "";
        "Comment thread context:";
        comments_area_tree_text;
        "";
        "Requesting comment:";
        comment_tree_text;
      ])

let dispatch_comment_to_master config ~graph ~agent_name ~master_session
    ~target_tree_texts ~comments_area_tree_text ~comment_tree_text comment_block
    =
  let prompt =
    build_master_comment_dispatch_prompt config ~graph ~agent_name
      ~comment_block ~target_tree_texts ~comments_area_tree_text
      ~comment_tree_text
  in
  start_codex config (build_codex_resume_command config master_session prompt)

let command_id _ = Command_id.Agent_bridge
let validate_parsed _ = Ok ()

let build ?registry:_ config _globals = function
  | Parsed_bridge -> (
      match config.Cli_config.repo with
      | Some repo ->
          Ok (Agent_bridge { repo; graph = Cli_config.repo_to_graph repo })
      | None -> Error (Error.missing_repo "repo is required for agent bridge"))

let kw value = Edn_util.keyword value
let sym value = Edn_util.string ("~$" ^ value)
let vector values = Edn_util.vector values
let list values = Edn_util.list values
let empty_rules = vector []
let agent_bridge_registry_page = "AgentBridge"
let master_prompt_wrapper_title = "AgentBridge master prompt"
let task_prompt_template_title = "Task prompt template"
let comment_prompt_template_title = "Comment prompt template"

let page_name_sanity_lc value =
  value |> String.trim |> String.lowercase_ascii |> String.to_seq
  |> Seq.filter (function ' ' | '\t' | '\n' | '\r' -> false | _ -> true)
  |> String.of_seq

let registry_page_name () = page_name_sanity_lc agent_bridge_registry_page
let agent_page_name agent_name = page_name_sanity_lc agent_name

let live_entity value =
  Option.is_some (Edn_util.get value ":db/id")
  && Option.is_none (Edn_util.get value ":logseq.property/deleted-at")

let first_live_entity values = List.find_opt live_entity values

let order_key value =
  match Edn_util.get value ":block/order" with
  | Some value -> (
      match (Edn_util.as_string value, Edn_util.as_int value) with
      | Some text, _ -> text
      | _, Some order -> string_of_int order
      | _ -> "")
  | None -> ""

let child_blocks block =
  let values =
    match
      (Edn_util.get block ":block/children", Edn_util.get block ":block/_parent")
    with
    | Some value, _ | None, Some value ->
        Option.value (Edn_util.as_seq value) ~default:[]
    | None, None -> []
  in
  values |> List.filter live_entity
  |> List.sort (fun a b -> String.compare (order_key a) (order_key b))

let rec block_title_tree block =
  let title =
    Option.value (Edn_util.get_string block ":block/title") ~default:""
  in
  title :: List.concat_map block_title_tree (child_blocks block)

let code_block_tag tag =
  ident_value tag = Some ":logseq.class/Code-block"
  || ident_value tag = Some "logseq.class/Code-block"

let block_has_code_tag block =
  value_list (Edn_util.get block ":block/tags") |> List.exists code_block_tag

let extract_code_blocks text =
  let len = String.length text in
  let rec loop acc index =
    if index + 3 > len then List.rev acc
    else if index + 3 <= len && String.sub text index 3 = "```" then
      match String.index_from_opt text (index + 3) '\n' with
      | None -> loop acc (index + 3)
      | Some body_start -> (
          let rec find_close i =
            if i + 3 > len then None
            else if String.sub text i 3 = "```" then Some i
            else find_close (i + 1)
          in
          match find_close (body_start + 1) with
          | None -> loop acc (body_start + 1)
          | Some close ->
              let body =
                String.sub text (body_start + 1) (close - body_start - 1)
              in
              loop (body :: acc) (close + 3))
    else loop acc (index + 1)
  in
  loop [] 0

let task_prompt_template body =
  {
    kind = Task;
    body;
    required_vars = [ "graph"; "block-uuid"; "agent-name"; "task-block-tree" ];
    allowed_vars = [ "graph"; "block-uuid"; "agent-name"; "task-block-tree" ];
  }

let comment_prompt_template body =
  {
    kind = Comment;
    body;
    required_vars =
      [
        "graph";
        "comment-uuid";
        "agent-name";
        "comment-target-context";
        "comment-thread-context";
        "requesting-comment";
      ];
    allowed_vars =
      [
        "graph";
        "comment-uuid";
        "agent-name";
        "comment-target-context";
        "comment-thread-context";
        "requesting-comment";
      ];
  }

let prompt_template_for_kind = function
  | Task -> task_prompt_template
  | Comment -> comment_prompt_template

let prompt_template_title = function
  | Task -> task_prompt_template_title
  | Comment -> comment_prompt_template_title

let default_prompt_template = function
  | Task -> default_task_prompt_template
  | Comment -> default_comment_prompt_template

let prompt_template_from_block kind block =
  let templates =
    block_title_tree block |> List.concat_map extract_code_blocks
  in
  let renderable =
    templates
    |> List.filter (fun body ->
        validate_prompt_template ((prompt_template_for_kind kind) body) = Ok ())
  in
  match renderable with
  | [ body ] -> Ok body
  | _ -> (
      match templates with
      | [ body ] -> (
          match
            validate_prompt_template ((prompt_template_for_kind kind) body)
          with
          | Ok () -> Ok body
          | Error err -> Error err)
      | _ ->
          Error
            (Error.make
               (Edn_util.keyword_t "agent-prompt-template-invalid")
               "agent bridge prompt template must contain one code block"))

let blocks_by_title blocks title =
  List.find_opt
    (fun block -> Edn_util.get_string block ":block/title" = Some title)
    blocks

let agent_bridge_registry_page_query =
  vector
    [
      Edn_util.map
        [
          ( kw ":find",
            vector
              [
                vector
                  [
                    list
                      [
                        sym "pull";
                        sym "?p";
                        vector
                          [
                            kw ":db/id";
                            kw ":block/uuid";
                            kw ":block/name";
                            kw ":block/title";
                            kw ":logseq.property/deleted-at";
                          ];
                      ];
                    sym "...";
                  ];
              ] );
          (kw ":in", list [ sym "$"; sym "?page-name" ]);
          ( kw ":where",
            vector [ vector [ sym "?p"; kw ":block/name"; sym "?page-name" ] ]
          );
        ];
      Edn_util.string (registry_page_name ());
    ]

let registered_agent_query agent_name =
  vector
    [
      Edn_util.map
        [
          ( kw ":find",
            vector
              [
                vector
                  [
                    list
                      [
                        sym "pull";
                        sym "?p";
                        vector
                          [
                            kw ":db/id";
                            kw ":block/uuid";
                            kw ":block/name";
                            kw ":block/title";
                            kw ":logseq.property/deleted-at";
                          ];
                      ];
                    sym "...";
                  ];
              ] );
          (kw ":in", list [ sym "$"; sym "?agent-page-name" ]);
          ( kw ":where",
            vector
              [ vector [ sym "?p"; kw ":block/name"; sym "?agent-page-name" ] ]
          );
        ];
      Edn_util.string (agent_page_name agent_name);
    ]

let agent_master_prompt_blocks_query page_id =
  vector
    [
      Edn_util.map
        [
          ( kw ":find",
            vector
              [
                vector
                  [
                    list
                      [
                        sym "pull";
                        sym "?b";
                        vector
                          [
                            kw ":db/id";
                            kw ":block/uuid";
                            kw ":block/title";
                            kw ":block/order";
                            kw ":logseq.property/deleted-at";
                            Edn_util.map
                              [
                                ( kw ":block/_parent",
                                  vector
                                    [
                                      kw ":db/id";
                                      kw ":block/uuid";
                                      kw ":block/title";
                                      kw ":block/order";
                                      kw ":logseq.property/deleted-at";
                                      Edn_util.map
                                        [
                                          ( kw ":block/tags",
                                            vector
                                              [
                                                kw ":db/id";
                                                kw ":db/ident";
                                                kw ":block/name";
                                                kw ":block/title";
                                              ] );
                                        ];
                                    ] );
                              ];
                          ];
                      ];
                    sym "...";
                  ];
              ] );
          (kw ":in", list [ sym "$"; sym "?page-id" ]);
          ( kw ":where",
            vector [ vector [ sym "?b"; kw ":block/parent"; sym "?page-id" ] ]
          );
        ];
      Edn_util.int64 page_id;
    ]

let prompt_template_blocks_query page_id =
  vector
    [
      Edn_util.map
        [
          ( kw ":find",
            vector
              [
                vector
                  [
                    list
                      [
                        sym "pull";
                        sym "?b";
                        vector
                          [
                            kw ":db/id";
                            kw ":block/uuid";
                            kw ":block/title";
                            kw ":block/order";
                            Edn_util.map
                              [
                                ( kw ":block/_parent",
                                  vector
                                    [
                                      kw ":db/id";
                                      kw ":block/uuid";
                                      kw ":block/title";
                                      kw ":block/order";
                                      Edn_util.map
                                        [
                                          ( kw ":block/_parent",
                                            vector
                                              [
                                                kw ":db/id";
                                                kw ":block/uuid";
                                                kw ":block/title";
                                                kw ":block/order";
                                              ] );
                                        ];
                                    ] );
                              ];
                          ];
                      ];
                    sym "...";
                  ];
              ] );
          (kw ":in", list [ sym "$"; sym "?page-id" ]);
          ( kw ":where",
            vector [ vector [ sym "?b"; kw ":block/parent"; sym "?page-id" ] ]
          );
        ];
      Edn_util.int64 page_id;
    ]

let task_ancestor_session_selector =
  vector
    [
      kw ":db/id";
      kw ":block/uuid";
      kw ":block/title";
      Edn_util.map
        [ (kw ":block/tags", vector [ kw ":db/ident"; kw ":block/title" ]) ];
      kw ":logseq.property.agent/session-id";
      Edn_util.map [ (kw ":block/parent", vector [ kw ":db/id" ]) ];
    ]

let routable_task_selector =
  vector
    [
      kw ":db/id";
      kw ":block/uuid";
      kw ":block/title";
      Edn_util.map
        [ (kw ":block/tags", vector [ kw ":db/ident"; kw ":block/title" ]) ];
      Edn_util.map
        [
          ( kw ":logseq.property/status",
            vector [ kw ":db/ident"; kw ":block/title" ] );
        ];
      Edn_util.map
        [
          ( kw ":logseq.property/assignee",
            vector
              [
                kw ":db/id"; kw ":block/title"; kw ":block/name"; kw ":db/ident";
              ] );
        ];
      kw ":logseq.property.agent/session-id";
      Edn_util.map [ (kw ":block/parent", vector [ kw ":db/id" ]) ];
    ]

let routable_task_query agent_name =
  vector
    [
      Edn_util.map
        [
          ( kw ":find",
            vector
              [
                vector
                  [
                    list [ sym "pull"; sym "?e"; routable_task_selector ];
                    sym "...";
                  ];
              ] );
          (kw ":in", list [ sym "$"; sym "?agent-name"; sym "%" ]);
          ( kw ":where",
            vector
              [
                vector [ sym "?e"; kw ":block/tags"; kw ":logseq.class/Task" ];
                vector [ sym "?e"; kw ":logseq.property/status"; sym "?status" ];
                vector
                  [
                    sym "?status";
                    kw ":db/ident";
                    kw ":logseq.property/status.todo";
                  ];
                vector
                  [
                    sym "?assignee-property";
                    kw ":block/name";
                    Edn_util.string "assignee";
                  ];
                vector
                  [
                    sym "?assignee-property";
                    kw ":db/ident";
                    sym "?assignee-attr";
                  ];
                vector [ sym "?e"; sym "?assignee-attr"; sym "?assignee-ref" ];
                vector
                  [ sym "?assignee-ref"; kw ":block/title"; sym "?agent-name" ];
              ] );
        ];
      Edn_util.string agent_name;
      empty_rules;
    ]

let comment_block_selector =
  vector
    [
      kw ":db/id";
      kw ":block/uuid";
      kw ":block/title";
      Edn_util.map
        [ (kw ":block/tags", vector [ kw ":db/ident"; kw ":block/title" ]) ];
      Edn_util.map
        [
          ( kw ":block/refs",
            vector [ kw ":db/id"; kw ":block/title"; kw ":block/name" ] );
        ];
      Edn_util.map
        [
          ( kw ":block/parent",
            vector
              [
                kw ":db/id";
                kw ":block/uuid";
                kw ":block/title";
                Edn_util.map
                  [
                    ( kw ":block/tags",
                      vector [ kw ":db/ident"; kw ":block/title" ] );
                  ];
              ] );
        ];
      sym "*";
    ]

let comment_target_block_selector =
  vector
    [
      kw ":db/id";
      kw ":block/uuid";
      kw ":block/title";
      Edn_util.map
        [
          ( kw ":logseq.property/assignee",
            vector
              [
                kw ":db/id"; kw ":block/title"; kw ":block/name"; kw ":db/ident";
              ] );
        ];
      kw ":logseq.property.agent/session-id";
      sym "*";
    ]

let comments_area_selector =
  vector
    [
      kw ":db/id";
      kw ":block/uuid";
      kw ":block/title";
      Edn_util.map
        [ (kw ":block/tags", vector [ kw ":db/ident"; kw ":block/title" ]) ];
      Edn_util.map
        [
          (kw ":logseq.property.comments/blocks", comment_target_block_selector);
        ];
    ]

let reaction_query target_uuid emoji_id =
  vector
    [
      Edn_util.map
        [
          (kw ":find", list [ sym "?r"; sym "." ]);
          ( kw ":in",
            list [ sym "$"; sym "?target-uuid"; sym "?emoji-id"; sym "%" ] );
          ( kw ":where",
            vector
              [
                vector [ sym "?target"; kw ":block/uuid"; sym "?target-uuid" ];
                vector
                  [
                    sym "?r";
                    kw ":logseq.property.reaction/target";
                    sym "?target";
                  ];
                vector
                  [
                    sym "?r";
                    kw ":logseq.property.reaction/emoji-id";
                    sym "?emoji-id";
                  ];
                list
                  [
                    sym "missing?";
                    sym "$";
                    sym "?r";
                    kw ":logseq.property/created-by-ref";
                  ];
              ] );
        ];
      Edn_util.uuid target_uuid;
      Edn_util.string emoji_id;
      empty_rules;
    ]

let task_status_query block_uuid =
  vector
    [
      Edn_util.map
        [
          (kw ":find", list [ sym "?status-ident"; sym "." ]);
          (kw ":in", list [ sym "$"; sym "?block-uuid" ]);
          ( kw ":where",
            vector
              [
                vector [ sym "?block"; kw ":block/uuid"; sym "?block-uuid" ];
                vector
                  [ sym "?block"; kw ":logseq.property/status"; sym "?status" ];
                vector [ sym "?status"; kw ":db/ident"; sym "?status-ident" ];
              ] );
        ];
      Edn_util.uuid block_uuid;
    ]

let values_of_query_result value =
  match (Edn_util.as_vector value, Edn_util.as_list value) with
  | Some values, _ | _, Some values -> values
  | _ -> []

let unquote_transit_value = function
  | Melange_edn.Any (Melange_edn.Tagged (("transit/quote" | "'"), value)) ->
      value
  | value -> value

let keyword_string value = value |> unquote_transit_value |> Edn_util.as_keyword

let bridge_result_value (result : bridge_result) =
  Edn_util.map
    [
      (kw ":mode", Edn_util.any result.mode);
      (kw ":graph", Edn_util.string (Cli_primitive.string_of_graph result.graph));
      (kw ":agent-name", Edn_util.string result.agent_name);
      (kw ":routed", Edn_util.vector result.routed);
    ]

let routed_task_value task =
  Edn_util.map
    [
      (kw ":block", task.block);
      ( kw ":session",
        match task.session with
        | Some session -> Edn_util.string session
        | None -> Edn_util.nil );
    ]

let list_routable_tasks invoke_config repo agent_name =
  let open Cli_effect in
  bind
    (Transport.thread_api_q invoke_config ~repo
       ~query:
         (Edn_util.expect_vector_t "routable task query"
            (routable_task_query agent_name)))
    (fun result ->
      let routed =
        result |> values_of_query_result
        |> List.filter (fun value ->
            routable_task_decision (Entity.of_value value) ~agent_name
            = Routable)
      in
      pure routed)

let apply_outliner_ops invoke_config repo ops =
  Transport.thread_api_apply_outliner_ops invoke_config ~repo
    ~ops:(Edn_util.vector_t ops) ~options:(Edn_util.map_t [])

let pull_registry_page invoke_config repo =
  let open Cli_effect in
  bind
    (Transport.thread_api_q invoke_config ~repo
       ~query:
         (Edn_util.expect_vector_t "agent registry page query"
            agent_bridge_registry_page_query))
    (fun pages -> pure (first_live_entity (values_of_query_result pages)))

let pull_agent_page invoke_config repo agent_name =
  let open Cli_effect in
  bind
    (Transport.thread_api_q invoke_config ~repo
       ~query:
         (Edn_util.expect_vector_t "registered agent query"
            (registered_agent_query agent_name)))
    (fun pages -> pure (first_live_entity (values_of_query_result pages)))

let create_page invoke_config repo title =
  apply_outliner_ops invoke_config repo
    [
      vector
        [ kw ":create-page"; vector [ Edn_util.string title; Edn_util.map [] ] ];
    ]

let ensure_registry_page invoke_config repo =
  let open Cli_effect in
  bind (pull_registry_page invoke_config repo) (function
    | Some page -> pure page
    | None ->
        bind (create_page invoke_config repo agent_bridge_registry_page)
          (fun _ ->
            bind (pull_registry_page invoke_config repo) (function
              | Some page -> pure page
              | None ->
                  error
                    (Failure "agent bridge registry page not found after create"))))

let register_agent_bridge invoke_config repo agent_name =
  let open Cli_effect in
  bind (ensure_registry_page invoke_config repo) (fun _ ->
      bind (pull_agent_page invoke_config repo agent_name) (function
        | Some _ -> pure ()
        | None ->
            bind (create_page invoke_config repo agent_name) (fun _ ->
                bind (pull_agent_page invoke_config repo agent_name) (function
                  | Some _ -> pure ()
                  | None ->
                      error
                        (Failure
                           "agent bridge agent page not found after create")))))

let master_prompt_from_block block =
  match Edn_util.get_string block ":block/title" with
  | Some title when title = master_prompt_wrapper_title -> (
      let prompts =
        child_blocks block
        |> List.filter block_has_code_tag
        |> List.filter_map (fun child ->
            Option.bind
              (Edn_util.get_string child ":block/title")
              trim_non_empty)
      in
      match prompts with
      | [ prompt ] -> Ok prompt
      | [] ->
          Error
            (Error.make
               (Edn_util.keyword_t "agent-master-prompt-invalid")
               "agent bridge master prompt code block is missing")
      | _ ->
          Error
            (Error.make
               (Edn_util.keyword_t "agent-master-prompt-invalid")
               "agent bridge master prompt must contain one code block"))
  | _ ->
      Error
        (Error.make
           (Edn_util.keyword_t "agent-master-prompt-invalid")
           "agent bridge master prompt wrapper is invalid")

let hex_digest_prefix byte_count seed =
  let digest = Digest.string seed in
  let rec loop index acc =
    if index >= byte_count then String.concat "" (List.rev acc)
    else
      loop (index + 1)
        (Printf.sprintf "%02x" (Char.code (String.get digest index)) :: acc)
  in
  loop 0 []

let insert_default_master_prompt invoke_config repo agent_page_uuid =
  let nonce =
    Printf.sprintf "%.17g" (Time.time_to_epoch_seconds_float (Time.now ()))
  in
  let block_uuid =
    "00000000-0000-4000-8000-"
    ^ hex_digest_prefix 6 (agent_page_uuid ^ ":" ^ nonce)
  in
  let code_uuid =
    "00000000-0000-4000-8001-" ^ hex_digest_prefix 6 (block_uuid ^ ":" ^ nonce)
  in
  let code_block =
    Edn_util.map
      [
        (kw ":block/uuid", Edn_util.uuid code_uuid);
        (kw ":block/title", Edn_util.string default_master_prompt);
        (kw ":block/tags", Edn_util.set [ kw ":logseq.class/Code-block" ]);
        (kw ":logseq.property.node/display-type", kw ":code");
        (kw ":logseq.property.code/lang", Edn_util.string "markdown");
      ]
  in
  let wrapper_block =
    Edn_util.map
      [
        (kw ":block/uuid", Edn_util.uuid block_uuid);
        (kw ":block/title", Edn_util.string master_prompt_wrapper_title);
      ]
  in
  apply_outliner_ops invoke_config repo
    [
      vector
        [
          kw ":insert-blocks";
          vector
            [
              vector [ wrapper_block ];
              Edn_util.uuid agent_page_uuid;
              Edn_util.map
                [
                  (kw ":outliner-op", kw ":insert-blocks");
                  (kw ":sibling?", Edn_util.bool false);
                  (kw ":bottom?", Edn_util.bool false);
                  (kw ":keep-uuid?", Edn_util.bool true);
                ];
            ];
        ];
      vector
        [
          kw ":insert-blocks";
          vector
            [
              vector [ code_block ];
              Edn_util.uuid block_uuid;
              Edn_util.map
                [
                  (kw ":outliner-op", kw ":insert-blocks");
                  (kw ":sibling?", Edn_util.bool false);
                  (kw ":bottom?", Edn_util.bool false);
                  (kw ":keep-uuid?", Edn_util.bool true);
                ];
            ];
        ];
    ]

let insert_default_master_prompt_code invoke_config repo wrapper_uuid =
  let nonce =
    Printf.sprintf "%.17g" (Time.time_to_epoch_seconds_float (Time.now ()))
  in
  let code_uuid =
    "00000000-0000-4000-8001-" ^ hex_digest_prefix 6 (wrapper_uuid ^ ":" ^ nonce)
  in
  let code_block =
    Edn_util.map
      [
        (kw ":block/uuid", Edn_util.uuid code_uuid);
        (kw ":block/title", Edn_util.string default_master_prompt);
        (kw ":block/tags", Edn_util.set [ kw ":logseq.class/Code-block" ]);
        (kw ":logseq.property.node/display-type", kw ":code");
        (kw ":logseq.property.code/lang", Edn_util.string "markdown");
      ]
  in
  apply_outliner_ops invoke_config repo
    [
      vector
        [
          kw ":insert-blocks";
          vector
            [
              vector [ code_block ];
              Edn_util.uuid wrapper_uuid;
              Edn_util.map
                [
                  (kw ":outliner-op", kw ":insert-blocks");
                  (kw ":sibling?", Edn_util.bool false);
                  (kw ":bottom?", Edn_util.bool false);
                  (kw ":keep-uuid?", Edn_util.bool true);
                ];
            ];
        ];
    ]

let repairable_missing_master_prompt_code block =
  Edn_util.get_string block ":block/title" = Some master_prompt_wrapper_title
  && Option.is_some (Edn_util.get_string block ":block/uuid")
  && child_blocks block |> List.filter block_has_code_tag = []

let ensure_agent_master_prompt invoke_config repo agent_name =
  let open Cli_effect in
  bind (pull_agent_page invoke_config repo agent_name) (function
    | None -> error (Failure "agent bridge agent page not found")
    | Some page -> (
        match
          ( Edn_util.get_int64 page ":db/id",
            Edn_util.get_string page ":block/uuid" )
        with
        | None, _ -> error (Failure "agent bridge agent page id not found")
        | _, None -> error (Failure "agent bridge agent page uuid not found")
        | Some page_id, Some page_uuid ->
            bind
              (Transport.thread_api_q invoke_config ~repo
                 ~query:
                   (Edn_util.expect_vector_t "agent master prompt query"
                      (agent_master_prompt_blocks_query page_id)))
              (fun blocks ->
                match
                  values_of_query_result blocks
                  |> List.sort (fun a b ->
                      String.compare (order_key a) (order_key b))
                  |> first_live_entity
                with
                | Some block -> (
                    match master_prompt_from_block block with
                    | Ok prompt -> pure prompt
                    | Error err ->
                        if repairable_missing_master_prompt_code block then
                          match Edn_util.get_string block ":block/uuid" with
                          | Some wrapper_uuid ->
                              bind
                                (insert_default_master_prompt_code invoke_config
                                   repo wrapper_uuid) (fun _ ->
                                  pure default_master_prompt)
                          | None -> error (Failure err.Error.message)
                        else error (Failure err.Error.message))
                | None ->
                    bind
                      (insert_default_master_prompt invoke_config repo page_uuid)
                      (fun _ -> pure default_master_prompt))))

let ensure_prompt_templates invoke_config repo =
  let open Cli_effect in
  bind (ensure_registry_page invoke_config repo) (fun page ->
      match
        ( Edn_util.get_int64 page ":db/id",
          Edn_util.get_string page ":block/uuid" )
      with
      | None, _ -> error (Failure "agent bridge registry page id not found")
      | _, None -> error (Failure "agent bridge registry page uuid not found")
      | Some page_id, _ ->
          bind
            (Transport.thread_api_q invoke_config ~repo
               ~query:
                 (Edn_util.expect_vector_t "prompt template query"
                    (prompt_template_blocks_query page_id)))
            (fun blocks ->
              let blocks = values_of_query_result blocks in
              let template_or_default kind =
                match blocks_by_title blocks (prompt_template_title kind) with
                | Some block -> (
                    match prompt_template_from_block kind block with
                    | Ok template -> template
                    | Error _ -> default_prompt_template kind)
                | None -> default_prompt_template kind
              in
              pure
                {
                  task = template_or_default Task;
                  comment = template_or_default Comment;
                }))

let ensure_reaction invoke_config repo target_uuid emoji_id =
  let open Cli_effect in
  bind
    (Transport.thread_api_q invoke_config ~repo
       ~query:
         (Edn_util.expect_vector_t "reaction query"
            (reaction_query target_uuid emoji_id)))
    (fun existing ->
      if not (Edn_util.is_null existing) then pure ()
      else
        bind
          (apply_outliner_ops invoke_config repo
             [
               vector
                 [
                   kw ":toggle-reaction";
                   vector
                     [
                       Edn_util.uuid target_uuid;
                       Edn_util.string emoji_id;
                       Edn_util.nil;
                     ];
                 ];
             ])
          (fun _ -> pure ()))

let show_task_tree config repo graph block =
  let open Cli_effect in
  match block_uuid block with
  | None -> pure (block_title block)
  | Some uuid ->
      let action : Show.action =
        {
          repo;
          graph;
          target = Show.By_uuid uuid;
          multi_id = false;
          linked_references = false;
          ref_id_footer = false;
          page_hierarchy = false;
          level = Some 100;
        }
      in
      bind (Show.execute action config Output.Mode.Human) (fun result ->
          match
            Option.bind (Cli_result.data_value result) Edn_util.as_string
          with
          | Some text when String.trim text <> "" -> pure text
          | _ -> pure (block_title block))

let show_block_tree = show_task_tree

let string_contains ~needle value =
  let needle_len = String.length needle in
  let value_len = String.length value in
  needle_len = 0
  ||
  let rec loop index =
    index + needle_len <= value_len
    && (String.sub value index needle_len = needle || loop (index + 1))
  in
  loop 0

let tag_ident_matches ident tag =
  ident_value tag = Some ident
  || ident_value tag = Some (String.sub ident 1 (String.length ident - 1))

let comment_tag tag = tag_ident_matches ":logseq.class/Comment" tag
let comments_area_tag tag = tag_ident_matches ":logseq.class/Comments" tag

let has_tag predicate block =
  value_list (Edn_util.get block ":block/tags") |> List.exists predicate

let ref_titles block =
  value_list (Edn_util.get block ":block/refs")
  |> List.filter_map (fun ref ->
      Option.bind (Edn_util.get_string ref ":block/title") trim_non_empty)

let comment_block_matches block agent_name =
  Option.is_some (block_uuid block)
  && has_tag comment_tag block
  &&
  let title = block_title block in
  string_contains ~needle:("[[" ^ agent_name ^ "]]") title
  || List.mem agent_name (ref_titles block)

let comments_area_block block = has_tag comments_area_tag block

let parent_block block =
  match Edn_util.get block ":block/parent" with
  | Some parent when Option.is_some (Edn_util.as_map parent) -> Some parent
  | _ -> None

let pull_comment_block invoke_config repo block_id =
  Transport.thread_api_pull invoke_config ~repo
    ~selector:
      (Edn_util.expect_vector_t "comment block selector" comment_block_selector)
    ~lookup:(Edn_util.int64 block_id)

let pull_comments_area invoke_config repo comment_block =
  let open Cli_effect in
  match
    Option.bind (parent_block comment_block) (fun parent ->
        Edn_util.get_int64 parent ":db/id")
  with
  | None -> error (Failure "comment block parent is missing")
  | Some parent_id ->
      Transport.thread_api_pull invoke_config ~repo
        ~selector:
          (Edn_util.expect_vector_t "comments area selector"
             comments_area_selector)
        ~lookup:(Edn_util.int64 parent_id)

let comments_area_target_blocks comments_area =
  value_list (Edn_util.get comments_area ":logseq.property.comments/blocks")

let process_comment invoke_config repo graph agent_name config master_session
    comment_block =
  let open Cli_effect in
  let ( let* ) = bind in
  let* comments_area = pull_comments_area invoke_config repo comment_block in
  if not (comments_area_block comments_area) then
    error (Failure "comment parent is not a comments area")
  else
    let target_blocks = comments_area_target_blocks comments_area in
    let* target_tree_texts =
      let rec loop acc = function
        | [] -> pure (List.rev acc)
        | block :: rest ->
            let* text = show_block_tree config repo graph block in
            loop (text :: acc) rest
      in
      loop [] target_blocks
    in
    let* comments_area_tree_text =
      show_block_tree config repo graph comments_area
    in
    let* comment_tree_text = show_block_tree config repo graph comment_block in
    match
      dispatch_comment_to_master config
        ~graph:(Cli_primitive.string_of_graph graph)
        ~agent_name ~master_session ~target_tree_texts ~comments_area_tree_text
        ~comment_tree_text comment_block
    with
    | Error err -> error (Failure err.Error.message)
    | Ok session ->
        let* () =
          match block_uuid comment_block with
          | None -> pure ()
          | Some uuid -> ensure_reaction invoke_config repo uuid "eyes"
        in
        pure { block = comment_block; session = Some session }

let datom_attr datom = Edn_util.get_string datom ":a"
let datom_value_string datom = Edn_util.get_string datom ":v"

let datom_added datom =
  match Edn_util.get_bool datom ":added" with Some true -> true | _ -> false

let datom_entity_id datom =
  match Edn_util.get_int64 datom ":e" with
  | Some id -> Some id
  | None -> Edn_util.get_int64 datom ":db/id"

let comment_title_datom datom agent_name =
  datom_added datom
  && datom_attr datom = Some ":block/title"
  &&
  match datom_value_string datom with
  | Some title ->
      String.trim agent_name <> ""
      && (string_contains ~needle:("[[" ^ agent_name ^ "]]") title
         || string_contains ~needle:"[[" title)
  | None -> false

let sync_payload_tx_data payload = value_list (Edn_util.get payload ":tx-data")

let route_comment_datom invoke_config repo graph agent_name config
    master_session datom =
  let open Cli_effect in
  let ( let* ) = bind in
  match datom_entity_id datom with
  | None -> pure None
  | Some block_id ->
      let* comment_block = pull_comment_block invoke_config repo block_id in
      if comment_block_matches comment_block agent_name then
        let* routed =
          process_comment invoke_config repo graph agent_name config
            master_session comment_block
        in
        pure (Some routed)
      else pure None

let route_comment_datoms invoke_config repo graph agent_name config
    master_session payload =
  let open Cli_effect in
  let datoms =
    sync_payload_tx_data payload
    |> List.filter (fun datom -> comment_title_datom datom agent_name)
  in
  let rec loop acc = function
    | [] -> pure (List.rev acc)
    | datom :: rest ->
        bind
          (route_comment_datom invoke_config repo graph agent_name config
             master_session datom) (function
          | Some routed -> loop (routed :: acc) rest
          | None -> loop acc rest)
  in
  loop [] datoms

let parent_block_id block =
  match Edn_util.get block ":block/parent" with
  | Some parent -> (
      match (Edn_util.as_map parent, Edn_util.as_int64 parent) with
      | Some _, _ -> Edn_util.get_int64 parent ":db/id"
      | _, Some id -> Some id
      | _ -> None)
  | None -> None

let nearest_ancestor_task_session invoke_config repo block =
  let open Cli_effect in
  let rec loop = function
    | None -> pure None
    | Some parent_id ->
        bind
          (Transport.thread_api_pull invoke_config ~repo
             ~selector:
               (Edn_util.expect_vector_t "task ancestor selector"
                  task_ancestor_session_selector)
             ~lookup:(Edn_util.int64 parent_id))
          (fun parent ->
            match
              ( has_task_tag parent,
                Option.bind
                  (Edn_util.get_string parent
                     ":logseq.property.agent/session-id")
                  trim_non_empty,
                Edn_util.get_string parent ":block/uuid" )
            with
            | true, Some session_id, Some parent_block_uuid ->
                pure (Some { parent_block_uuid; session_id })
            | _ -> loop (parent_block_id parent))
  in
  loop (parent_block_id block)

let mark_task_started invoke_config repo block =
  let open Cli_effect in
  match block_uuid block with
  | None -> pure ()
  | Some uuid ->
      bind (ensure_reaction invoke_config repo uuid "eyes") (fun () ->
          bind
            (Transport.thread_api_q invoke_config ~repo
               ~query:
                 (Edn_util.expect_vector_t "task status query"
                    (task_status_query uuid)))
            (fun status ->
              match keyword_string status with
              | Some ":logseq.property/status.todo" ->
                  bind
                    (apply_outliner_ops invoke_config repo
                       [
                         vector
                           [
                             kw ":batch-set-property";
                             vector
                               [
                                 vector [ Edn_util.uuid uuid ];
                                 kw ":logseq.property/status";
                                 kw ":logseq.property/status.doing";
                                 Edn_util.map [];
                               ];
                           ];
                       ])
                    (fun _ -> pure ())
              | _ -> pure ()))

let process_task invoke_config repo graph agent_name config master_session block
    =
  let open Cli_effect in
  bind (show_task_tree config repo graph block) (fun tree_text ->
      bind (nearest_ancestor_task_session invoke_config repo block)
        (fun inherited_session ->
          match
            dispatch_task_to_master config
              ~graph:(Cli_primitive.string_of_graph graph)
              ~agent_name ~master_session ?inherited_session ~tree_text block
          with
          | Error err -> error (Failure err.Error.message)
          | Ok session ->
              bind (mark_task_started invoke_config repo block) (fun () ->
                  pure { block; session = Some session })))

let process_tasks invoke_config repo graph agent_name config master_session
    tasks =
  let open Cli_effect in
  let rec loop acc = function
    | [] -> pure (List.rev acc)
    | block :: rest ->
        bind
          (process_task invoke_config repo graph agent_name config
             master_session block) (fun routed -> loop (routed :: acc) rest)
  in
  loop [] tasks

let bridge_log_line message = Time.rfc3339_millis (Time.now ()) ^ " " ^ message

let emit_bridge_log : type a. a Output.Mode.t -> string -> unit =
 fun mode message ->
  match mode with
  | Output.Mode.Human -> Cli_unix.write_stdout (bridge_log_line message ^ "\n")
  | Output.Mode.Json | Output.Mode.Edn -> ()

let command_preview command =
  let shell_safe value =
    let rec loop index =
      if index >= String.length value then true
      else
        match value.[index] with
        | 'A' .. 'Z'
        | 'a' .. 'z'
        | '0' .. '9'
        | '.' | '_' | ':' | '/' | '=' | '-' ->
            loop (index + 1)
        | _ -> false
    in
    value <> "" && loop 0
  in
  let quote value =
    if shell_safe value then value
    else "'" ^ String.concat "'\"'\"'" (String.split_on_char '\'' value) ^ "'"
  in
  String.concat " " (List.map quote command)

let is_uri_component_unescaped = function
  | 'A' .. 'Z'
  | 'a' .. 'z'
  | '0' .. '9'
  | '-' | '_' | '.' | '!' | '~' | '*' | '\'' | '(' | ')' ->
      true
  | _ -> false

let encode_uri_component value =
  let hex = "0123456789ABCDEF" in
  let buffer = Buffer.create (String.length value) in
  String.iter
    (fun c ->
      if is_uri_component_unescaped c then Buffer.add_char buffer c
      else
        let code = Char.code c in
        Buffer.add_char buffer '%';
        Buffer.add_char buffer hex.[code lsr 4];
        Buffer.add_char buffer hex.[code land 0x0F])
    value;
  Buffer.contents buffer

let bridge_lock_name graph agent_name =
  let graph = Cli_primitive.string_of_graph graph in
  encode_uri_component graph ^ "--" ^ encode_uri_component agent_name ^ ".lock"

let bridge_lock_dir config graph agent_name =
  Filename.concat
    (Filename.concat config.Cli_config.root_dir "agent-bridge-locks")
    (bridge_lock_name graph agent_name)

let bridge_lock_owner_path lock_dir = Filename.concat lock_dir "owner.edn"

let edn_string_escape value =
  let buffer = Buffer.create (String.length value) in
  String.iter
    (function
      | '"' -> Buffer.add_string buffer "\\\""
      | '\\' -> Buffer.add_string buffer "\\\\"
      | '\n' -> Buffer.add_string buffer "\\n"
      | '\r' -> Buffer.add_string buffer "\\r"
      | '\t' -> Buffer.add_string buffer "\\t"
      | c -> Buffer.add_char buffer c)
    value;
  Buffer.contents buffer

let bridge_lock_owner graph agent_name =
  let graph = Cli_primitive.string_of_graph graph in
  Printf.sprintf "{:pid %d :graph \"%s\" :agent \"%s\" :started-at \"%s\"}\n"
    (Cli_unix.getpid ()) (edn_string_escape graph)
    (edn_string_escape agent_name)
    (Printf.sprintf "%.3f" (Time.time_to_epoch_seconds_float (Time.now ())))

let bridge_lock_error graph agent_name =
  let graph = Cli_primitive.string_of_graph graph in
  Error.make
    (Edn_util.keyword_t "agent-bridge-already-running")
    ("agent bridge is already running for graph '" ^ graph
   ^ "' and AgentBridge name '" ^ agent_name ^ "'")

let bridge_lock_failure message =
  Error.make (Edn_util.keyword_t "agent-bridge-lock-failed") message

let bridge_lock_owner_pid lock_dir =
  try
    let owner =
      Cli_unix.read_text_file (bridge_lock_owner_path lock_dir)
      |> Melange_edn.of_edn_string
    in
    Edn_util.get_int owner ":pid"
  with _ -> None

let stale_bridge_lock lock_dir =
  match bridge_lock_owner_pid lock_dir with
  | Some pid -> pid <= 0 || not (Cli_unix.process_running pid)
  | None -> true

let release_bridge_lock lock_dir =
  try Cli_unix.remove_tree lock_dir with _ -> ()

let acquire_bridge_lock config graph agent_name =
  let lock_dir = bridge_lock_dir config graph agent_name in
  let rec loop retried =
    try
      Cli_unix.mkdir_p (Filename.dirname lock_dir);
      match Cli_unix.mkdir_exclusive lock_dir 0o755 with
      | Cli_unix.Created -> (
          try
            Cli_unix.write_text_file
              (bridge_lock_owner_path lock_dir)
              (bridge_lock_owner graph agent_name);
            Ok lock_dir
          with exn ->
            release_bridge_lock lock_dir;
            Error
              (bridge_lock_failure
                 ("failed to write agent bridge lock owner: "
                ^ Printexc.to_string exn)))
      | Cli_unix.Already_exists ->
          if (not retried) && stale_bridge_lock lock_dir then (
            release_bridge_lock lock_dir;
            loop true)
          else Error (bridge_lock_error graph agent_name)
    with exn ->
      Error
        (bridge_lock_failure
           ("failed to acquire agent bridge lock: " ^ Printexc.to_string exn))
  in
  loop false

let with_bridge_lock config (graph : Cli_primitive.graph) agent_name mode body =
  let open Cli_effect in
  match acquire_bridge_lock config graph agent_name with
  | Error err ->
      pure (Output_mode.error ~command:Command_id.Agent_bridge mode err)
  | Ok lock_dir ->
      finally (body ()) (fun () ->
          release_bridge_lock lock_dir;
          pure ())

let route_current_tasks invoke_config repo (graph : Cli_primitive.graph)
    agent_name config master_session =
  let open Cli_effect in
  let ( let* ) = bind in
  let* tasks = list_routable_tasks invoke_config repo agent_name in
  process_tasks invoke_config repo graph agent_name config master_session tasks

let execute_bridge_once repo (graph : Cli_primitive.graph) agent_name config
    mode =
  let open Cli_effect in
  let ( let* ) = bind in
  let* server =
    Server_runtime.ensure_server config repo ~create_empty_db:false
  in
  match server with
  | Error err ->
      pure (Output_mode.error ~command:Command_id.Agent_bridge mode err)
  | Ok invoke_config -> (
      let* () = register_agent_bridge invoke_config repo agent_name in
      let* master_prompt =
        ensure_agent_master_prompt invoke_config repo agent_name
      in
      let* _prompt_templates = ensure_prompt_templates invoke_config repo in
      match ensure_master_session config master_prompt with
      | Error err ->
          pure (Output_mode.error ~command:Command_id.Agent_bridge mode err)
      | Ok master_session ->
          let* routed_tasks =
            route_current_tasks invoke_config repo graph agent_name config
              master_session
          in
          let result =
            {
              mode = Edn_util.keyword_t ":processed-once";
              graph;
              agent_name;
              routed = List.map routed_task_value routed_tasks;
            }
          in
          pure
            (Cli_result.ok ~command:Command_id.Agent_bridge mode
               (Raw (bridge_result_value result))))

let sync_db_changes_event_type = Edn_util.keyword_t ":sync-db-changes"

let wait_forever () =
  let task, _resolver = Cli_effect.wait () in
  task

let execute_bridge_forever repo (graph : Cli_primitive.graph) agent_name config
    mode =
  let open Cli_effect in
  let ( let* ) = bind in
  emit_bridge_log mode "checking the environment ...";
  emit_bridge_log mode ("using graph: " ^ Cli_primitive.string_of_graph graph);
  emit_bridge_log mode ("using agent name: " ^ agent_name);
  emit_bridge_log mode "checking codex cli ...";
  let* server =
    Server_runtime.ensure_server config repo ~create_empty_db:false
  in
  match server with
  | Error err ->
      pure (Output_mode.error ~command:Command_id.Agent_bridge mode err)
  | Ok invoke_config -> (
      emit_bridge_log mode "registering agent bridge ...";
      let* () = register_agent_bridge invoke_config repo agent_name in
      emit_bridge_log mode "checking master prompt ...";
      let* master_prompt =
        ensure_agent_master_prompt invoke_config repo agent_name
      in
      emit_bridge_log mode "checking prompt templates ...";
      let* _prompt_templates = ensure_prompt_templates invoke_config repo in
      emit_bridge_log mode
        ("Codex master command prepared: "
        ^ command_preview (build_codex_command config master_prompt));
      match ensure_master_session config master_prompt with
      | Error err ->
          pure (Output_mode.error ~command:Command_id.Agent_bridge mode err)
      | Ok master_session ->
          emit_bridge_log mode
            ("Codex master session started: " ^ master_session);
          let process_graph_changes event_type payload =
            if event_type = sync_db_changes_event_type then (
              emit_bridge_log mode "got graph changes: sync-db-changes";
              let* _routed_comments =
                route_comment_datoms invoke_config repo graph agent_name config
                  master_session payload
              in
              let* _routed_tasks =
                route_current_tasks invoke_config repo graph agent_name config
                  master_session
              in
              pure ())
            else pure ()
          in
          let* _subscription =
            Transport.connect_events invoke_config process_graph_changes
          in
          emit_bridge_log mode "listening graph changes ...";
          let* _initial_routed_tasks =
            route_current_tasks invoke_config repo graph agent_name config
              master_session
          in
          wait_forever ())

let execute (Agent_bridge { repo; graph }) config mode =
  let open Cli_effect in
  match resolve_agent_name config None with
  | Error err ->
      pure (Output_mode.error ~command:Command_id.Agent_bridge mode err)
  | Ok agent_name ->
      if not (codex_available config) then
        pure
          (Output_mode.error ~command:Command_id.Agent_bridge mode
             (Error.make
                (Edn_util.keyword_t "codex-not-found")
                "codex executable is not available"))
      else
        with_bridge_lock config graph agent_name mode (fun () ->
            if agent_bridge_process_once config then
              execute_bridge_once repo graph agent_name config mode
            else execute_bridge_forever repo graph agent_name config mode)

let metadata () =
  [
    {
      Command_registry.id = Command_id.Agent_bridge;
      path = Command_id.to_path Command_id.Agent_bridge;
      doc = "Run task agent bridge";
      long_doc = None;
      examples = [];
      options = [];
      category = Command_registry.Hidden;
      requires_graph = Command_id.requires_graph Command_id.Agent_bridge;
      requires_auth = Command_id.requires_auth Command_id.Agent_bridge;
      write_command = Command_id.is_write Command_id.Agent_bridge;
    };
  ]
