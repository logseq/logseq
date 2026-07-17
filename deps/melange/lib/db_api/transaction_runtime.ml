type value = Support.Runtime_codec.value
type transact_callback = (value -> value -> value -> value[@u])

type pipeline_callback =
  (Support.Datascript.transaction_report ->
   Support.Datascript.transaction_report
  [@u])

type invalid_callback =
  (Support.Datascript.transaction_report -> value -> unit[@u])

let transact_callback : transact_callback option ref = ref None
let pipeline_callback : pipeline_callback option ref = ref None
let invalid_callback : invalid_callback option ref = ref None

let registerTransact callback =
  transact_callback := Js.Nullable.toOption callback

let registerPipeline callback =
  pipeline_callback := Js.Nullable.toOption callback

let registerInvalidCallback callback =
  invalid_callback := Js.Nullable.toOption callback

let transactCallback () = Js.Nullable.fromOption !transact_callback
let pipelineCallback () = Js.Nullable.fromOption !pipeline_callback
let invalidCallback () = Js.Nullable.fromOption !invalid_callback
let hasTransact () = Option.is_some !transact_callback

let transact fallback repo tx_data tx_meta =
  let callback = Option.value !transact_callback ~default:fallback in
  (callback repo tx_data tx_meta [@u])

let applyPipeline report =
  Option.fold ~none:report
    ~some:(fun callback -> (callback report [@u]))
    !pipeline_callback

let notifyInvalid report errors =
  Option.iter (fun callback -> (callback report errors [@u])) !invalid_callback
