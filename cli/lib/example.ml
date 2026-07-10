type opts = { selector : string Rrbvec.t }
type parsed = Parsed_example of opts

type action = {
  selector : string;
  selector_path : string Rrbvec.t;
  matched_commands : string Rrbvec.t;
  examples : string Rrbvec.t;
  message : string;
}

type entry = { path : string Rrbvec.t; examples : string Rrbvec.t }

let entry path examples =
  { path = Vec.of_array path; examples = Vec.of_array examples }

let default_entries =
  Vec.of_array
    [|
      entry [| "graph"; "list" |] [| "logseq graph list" |];
      entry [| "graph"; "create" |]
        [|
          "logseq graph create --graph my-graph";
          "logseq graph create --graph my-graph --enable-sync";
          "logseq graph create --graph my-graph --enable-sync --e2ee-password \
           \"my-secret\"";
        |];
      entry [| "graph"; "switch" |] [| "logseq graph switch --graph my-graph" |];
      entry [| "graph"; "remove" |] [| "logseq graph remove --graph my-graph" |];
      entry [| "graph"; "validate" |]
        [|
          "logseq graph validate --graph my-graph";
          "logseq graph validate --graph my-graph --fix";
        |];
      entry [| "graph"; "info" |] [| "logseq graph info --graph my-graph" |];
      entry [| "graph"; "export" |]
        [|
          "logseq graph export --graph my-graph --type edn --file \
           /tmp/my-graph.edn --edn-options '{:export-type :graph \
           :include-timestamps? true}' --pretty-print";
          "logseq graph export --graph my-graph --type sqlite --file \
           /tmp/my-graph.sqlite";
        |];
      entry [| "graph"; "import" |]
        [|
          "logseq graph import --graph my-graph --type edn --input \
           /tmp/my-graph.edn";
        |];
      entry
        [| "graph"; "backup"; "list" |]
        [| "logseq graph backup list --graph my-graph" |];
      entry
        [| "graph"; "backup"; "create" |]
        [|
          "logseq graph backup create --graph my-graph";
          "logseq graph backup create --graph my-graph --name nightly";
        |];
      entry
        [| "graph"; "backup"; "restore" |]
        [|
          "logseq graph backup restore --src my-graph-nightly --dst \
           my-graph-restore";
        |];
      entry
        [| "graph"; "backup"; "remove" |]
        [| "logseq graph backup remove --src my-graph-nightly" |];
      entry [| "list"; "page" |]
        [|
          "logseq list page --graph my-graph";
          "logseq list page --graph my-graph --journal-only --limit 20";
          "logseq list page --graph my-graph --limit 50 --sort updated-at \
           --order desc";
        |];
      entry [| "list"; "tag" |]
        [|
          "logseq list tag --graph my-graph --with-properties";
          "logseq list tag --graph my-graph --include-built-in --limit 20 \
           --output json";
        |];
      entry [| "list"; "property" |]
        [|
          "logseq list property --graph my-graph --with-type";
          "logseq list property --graph my-graph --include-built-in --limit 20 \
           --output json";
        |];
      entry [| "list"; "task" |]
        [|
          "logseq list task --graph my-graph --status todo --priority high";
          "logseq list task --graph my-graph --content \"release\" --sort \
           updated-at --order desc";
        |];
      entry [| "list"; "node" |]
        [|
          "logseq list node --graph my-graph --tags project,work";
          "logseq list node --graph my-graph --properties status,priority \
           --sort updated-at --order desc";
        |];
      entry [| "list"; "asset" |]
        [|
          "logseq list asset --graph my-graph";
          "logseq list asset --graph my-graph --limit 20 --sort updated-at \
           --order desc";
        |];
      entry [| "upsert"; "block" |]
        [|
          "logseq upsert block --graph my-graph --target-page Home --content \
           \"New block\"";
          "logseq upsert block --graph my-graph --id 123 --content \"Updated \
           content\"";
          "logseq upsert block --graph my-graph --id 123 --target-page Home";
          "logseq upsert block --graph my-graph --target-page Meeting Notes \
           --content \"AI summary of the discussion\" --update-tags \
           '[\"AI-GENERATED\"]'";
          "logseq upsert block --graph my-graph --blocks '[{:block/title \
           \"A\"} {:block/title \"B\"}]'";
        |];
      entry [| "upsert"; "page" |]
        [|
          "logseq upsert page --graph my-graph --page Home --update-tags \
           '[\"project\"]'";
          "logseq upsert page --graph my-graph --id 999 --update-properties \
           '{:logseq.property/description \"Example\"}'";
        |];
      entry [| "upsert"; "task" |]
        [|
          "logseq upsert task --graph my-graph --content \"Ship release\" \
           --target-page Home --status todo --priority high --scheduled \
           \"2026-02-10T08:00:00.000Z\" --deadline \
           \"2026-02-12T18:00:00.000Z\"";
          "logseq upsert task --graph my-graph --page Weekly Plan --status \
           doing";
          "logseq upsert task --graph my-graph --id 123 --no-status \
           --no-priority";
        |];
      entry [| "upsert"; "asset" |]
        [|
          "logseq upsert asset --graph my-graph --path ./assets/logo.png \
           --target-page Home";
          "logseq upsert asset --graph my-graph --id 123 --content \"Updated \
           asset title\"";
        |];
      entry [| "upsert"; "tag" |]
        [|
          "logseq upsert tag --graph my-graph --name project";
          "logseq upsert tag --graph my-graph --id 200 --name Project Renamed";
          "logseq upsert tag --graph my-graph --name project --add-properties \
           '[\"status\" \"owner\"]'";
        |];
      entry [| "upsert"; "property" |]
        [|
          "logseq upsert property --graph my-graph --name status --type \
           default --cardinality one";
          "logseq upsert property --graph my-graph --id 321 --hide true";
        |];
      entry [| "remove"; "block" |]
        [|
          "logseq remove block --graph my-graph --id 123";
          "logseq remove block --graph my-graph --id '[123,456]'";
          "logseq remove block --graph my-graph --uuid \
           7f0f4bb3-2e48-4b46-ae0f-18f52ef0f8be";
        |];
      entry [| "remove"; "page" |]
        [|
          "logseq remove page --graph my-graph --page Home";
          "logseq remove page --graph my-graph --id 123";
        |];
      entry [| "remove"; "tag" |]
        [| "logseq remove tag --graph my-graph --name project" |];
      entry [| "remove"; "property" |]
        [|
          "logseq remove property --graph my-graph --name owner";
          "logseq remove property --graph my-graph --id 321";
        |];
      entry [| "query" |]
        [|
          "logseq query --graph my-graph --name recent-updated --inputs '[30]'";
          "logseq query --graph my-graph --name task-search --inputs \
           '[:logseq.property/status.done \"daily\"]'";
          "logseq query --graph my-graph --query '[:find [?e ...] :where [?e \
           :block/name]]'";
        |];
      entry [| "query"; "list" |]
        [|
          "logseq query list --graph my-graph";
          "logseq query list --graph my-graph --output edn";
        |];
      entry [| "search"; "block" |]
        [| "logseq search block --content \"task\" --graph my-graph" |];
      entry [| "search"; "page" |]
        [| "logseq search page --content \"home\" --graph my-graph" |];
      entry [| "search"; "property" |]
        [| "logseq search property --content \"owner\" --graph my-graph" |];
      entry [| "search"; "tag" |]
        [| "logseq search tag --content \"quote\" --graph my-graph" |];
      entry [| "show" |]
        [|
          "logseq show --graph my-graph --page Home";
          "logseq show --graph my-graph --page Foo --page-hierarchy true";
          "logseq show --graph my-graph --page \"Meeting Notes\" --level 2";
          "logseq show --graph my-graph --id 123 --level 3";
          "logseq show --graph my-graph --id '[123,456,789]'";
          "logseq show --graph my-graph --uuid \
           11111111-1111-1111-1111-111111111111";
        |];
      entry [| "server"; "list" |] [| "logseq server list" |];
      entry [| "server"; "cleanup" |] [| "logseq server cleanup" |];
      entry [| "server"; "start" |] [| "logseq server start --graph my-graph" |];
      entry [| "server"; "stop" |] [| "logseq server stop --graph my-graph" |];
      entry [| "server"; "restart" |]
        [| "logseq server restart --graph my-graph" |];
      entry [| "sync"; "status" |] [| "logseq sync status --graph my-graph" |];
      entry [| "sync"; "start" |]
        [|
          "logseq sync start --graph my-graph";
          "logseq sync start --graph my-graph --e2ee-password \"my-secret\"";
        |];
      entry [| "sync"; "stop" |] [| "logseq sync stop --graph my-graph" |];
      entry [| "sync"; "upload" |]
        [|
          "logseq sync upload --graph my-graph";
          "logseq sync upload --graph my-graph --e2ee-password \"my-secret\"";
        |];
      entry [| "sync"; "download" |]
        [|
          "logseq sync download --graph my-graph";
          "logseq sync download --graph my-graph --progress";
          "logseq sync download --graph my-graph --e2ee-password \"my-secret\"";
        |];
      entry
        [| "sync"; "asset"; "download" |]
        [|
          "logseq sync asset download --graph my-graph --id 123";
          "logseq sync asset download --graph my-graph --uuid <asset-uuid>";
        |];
      entry [| "sync"; "remote-graphs" |] [| "logseq sync remote-graphs" |];
      entry
        [| "sync"; "ensure-keys" |]
        [|
          "logseq sync ensure-keys";
          "logseq sync ensure-keys --e2ee-password \"my-secret\" --upload-keys";
        |];
      entry
        [| "sync"; "grant-access" |]
        [|
          "logseq sync grant-access --graph my-graph --graph-id \
           8b6ecdd0-1fab-4a9f-b3fb-3069c5f76e95 --email teammate@example.com";
        |];
      entry
        [| "sync"; "config"; "set" |]
        [| "logseq sync config set sync-enabled true" |];
      entry
        [| "sync"; "config"; "get" |]
        [| "logseq sync config get sync-enabled" |];
      entry
        [| "sync"; "config"; "unset" |]
        [| "logseq sync config unset sync-enabled" |];
    |]

let example_groups =
  Vec.of_array
    [|
      "graph";
      "list";
      "upsert";
      "remove";
      "query";
      "search";
      "show";
      "server";
      "sync";
    |]

let label path = Vec.string_concat " " path
let command_id _ = Command_id.Example
let validate_parsed _ = Ok ()

let registry_entries registry =
  registry.Command_registry.commands
  |> Vec.filter_map (fun (meta : Command_registry.command_meta) ->
      match Vec.nth_opt meta.path 0 with
      | Some group when Vec.mem group example_groups ->
          Some { path = meta.path; examples = meta.examples }
      | _ -> None)

let entries_for registry =
  let entries = registry_entries registry in
  if Vec.is_empty entries then default_entries else entries

let matching_entries entries selector =
  if Vec.is_empty selector then
    Vec.filter (fun entry -> not (Vec.is_empty entry.examples)) entries
  else if Vec.length selector = 1 then
    let group = Vec.nth selector 0 in
    Vec.filter
      (fun entry ->
        match Vec.nth_opt entry.path 0 with
        | Some first -> first = group
        | None -> false)
      entries
  else
    Vec.filter (fun entry -> Vec.equal String.equal entry.path selector) entries

let resolve_selector registry selector =
  match selector with
  | _ ->
      let entries = entries_for registry in
      let matches = matching_entries entries selector in
      let selector_label =
        if Vec.is_empty selector then "all" else label selector
      in
      if Vec.is_empty matches then
        Error
          (Error.unknown_command
             ("unknown example selector: " ^ selector_label))
      else
        let missing =
          matches
          |> Vec.filter (fun entry -> Vec.is_empty entry.examples)
          |> Vec.map (fun entry -> label entry.path)
        in
        if not (Vec.is_empty missing) then
          Error
            (Error.make Error.Missing_examples
               ("missing examples metadata for: "
               ^ Vec.string_concat ", " missing))
        else
          let matched_commands =
            Vec.map (fun entry -> label entry.path) matches
          in
          let examples = Vec.concat_map (fun entry -> entry.examples) matches in
          let count = Vec.length examples in
          Ok
            {
              selector = selector_label;
              selector_path = selector;
              matched_commands;
              examples;
              message =
                "Found "
                ^ Humanize_types.format_count count
                ^ " "
                ^ Humanize_types.pluralize_noun count "example"
                ^ " for selector " ^ selector_label;
            }

let build ?registry _ _ = function
  | Parsed_example { selector } ->
      resolve_selector
        (Option.value registry ~default:Command_registry.empty)
        selector

let value_of_action action =
  Edn_util.map_vec
    (Vec.of_array
       [|
         (Edn_util.keyword "selector", Edn_util.string action.selector);
         ( Edn_util.keyword "matched-commands",
           Edn_util.vector_vec
             (action.matched_commands
             |> Vec.map (fun command -> Edn_util.string command)) );
         ( Edn_util.keyword "examples",
           Edn_util.vector_vec
             (action.examples
             |> Vec.map (fun example -> Edn_util.string example)) );
         (Edn_util.keyword "message", Edn_util.string action.message);
       |])

let execute_with_mode action _config mode =
  Cli_effect.pure
    (Cli_result.ok ~command:Command_id.Example mode
       (Raw (value_of_action action)))

let metadata () =
  Vec.singleton
    {
      Command_registry.id = Command_id.Example;
      path = Command_id.to_path Command_id.Example;
      doc = "Show runnable command examples";
      long_doc = None;
      examples = Vec.empty;
      options = Vec.empty;
      category = Command_registry.Utilities;
      requires_graph = Command_id.requires_graph Command_id.Example;
      requires_auth = Command_id.requires_auth Command_id.Example;
      write_command = Command_id.is_write Command_id.Example;
      human_table_headers_order = Vec.empty;
    }

let execute action config =
  let (Output.Mode.Packed mode) = Output_mode.for_config config in
  execute_with_mode action config mode
