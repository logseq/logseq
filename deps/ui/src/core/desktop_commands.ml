let command name request response =
  let name = Result.get_ok (Lui_command.Name.of_string name) in
  Lui_command.v ~name ~request ~response

let list_graphs = command "logseq.graphs.list" Lui_command.Codec.unit Lui_command.Codec.string
let open_graph = command "logseq.graphs.open" Lui_command.Codec.string Lui_command.Codec.unit
let invoke = command "logseq.worker.invoke" Lui_command.Codec.string Lui_command.Codec.string
let events = command "logseq.worker.events" Lui_command.Codec.unit Lui_command.Codec.string
