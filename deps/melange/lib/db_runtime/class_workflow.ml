let field = Property_build.field
let assoc = Property_build.assoc

let ident_namespace runtime options =
  let value = field runtime options "ident-namespace" in
  if Melange_cljs_runtime_spec.Value_codec.value_is_nil runtime value then
    "user.class"
  else Sqlite_util.value_text runtime value

let unique_class_ident runtime datascript database ident =
  match Js.Nullable.toOption database with
  | None -> ident
  | Some database -> Db_ident.ensureUniqueWith runtime datascript database ident

let createUserIdent runtime datascript
    (database : Melange_datascript_spec.Api.database Js.Nullable.t) class_name
    options =
  Db_ident.createGenerated (ident_namespace runtime options) class_name
  |> Melange_cljs_runtime_spec.Value_codec.keyword_from_string runtime
  |> unique_class_ident runtime datascript database

let buildNew runtime datascript database (now_ms : Sqlite_util.float_callback)
    page options =
  let title = field runtime page "block/title" in
  if not (Melange_cljs_runtime_spec.Value_codec.value_is_string runtime title)
  then invalid_arg "Class title must be a string";
  let ident =
    createUserIdent runtime datascript database
      (Melange_cljs_runtime_spec.Value_codec.string_from_value runtime title)
      options
  in
  page
  |> assoc runtime "db/ident" ident
  |> Sqlite_util.buildClassWith runtime now_ms
