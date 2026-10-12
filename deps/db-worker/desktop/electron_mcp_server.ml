(* Port of electron.mcp-server — MCP routes on the desktop API server.
   npm externals (@modelcontextprotocol/sdk, zod/v3) are local to this
   file; fastify request/reply types come from Electron_mcp_transport. *)

module Sdk = struct
  type mcp_server

  type streamable_transport = Electron_mcp_transport.transport

  external is_initialize_request : Js.Json.t -> bool
    = "isInitializeRequest"
    [@@mel.module "@modelcontextprotocol/sdk/types.js"]

  external mcp_server_make :
    < name : string ; version : string > Js.t -> mcp_server = "McpServer"
    [@@mel.new]
    [@@mel.module "@modelcontextprotocol/sdk/server/mcp.js"]

  external register_tool :
    mcp_server ->
    string ->
    Js.Json.t ->
    (Js.Json.t -> Js.Json.t Js.Promise.t [@u]) ->
    unit = "registerTool" [@@mel.send]

  external connect :
    mcp_server -> streamable_transport -> unit Js.Promise.t = "connect"
    [@@mel.send]

  external transport_make :
    < sessionIdGenerator : unit -> string
    ; enableDnsRebindingProtection : bool
    ; allowedHosts : string array >
    Js.t ->
    streamable_transport = "StreamableHTTPServerTransport"
    [@@mel.new]
    [@@mel.module "@modelcontextprotocol/sdk/server/streamableHttp.js"]

  external set_onclose :
    streamable_transport -> (unit -> unit) -> unit = "onclose"
    [@@mel.set]

  external session_id : streamable_transport -> string option
    = "sessionId"
    [@@mel.get] [@@mel.return { undefined_to_opt }]

  external transport_close : streamable_transport -> unit = "close"
    [@@mel.send]
end

(* zod v3 — zod 4 doesn't work w/ mcp (typescript-sdk #925). A schema
   is a plain JS object, so schema = Js.Json.t keeps the inputSchema
   literals free of casts. *)
module Z = struct
  type schema = Js.Json.t

  external boolean : unit -> schema = "boolean" [@@mel.module "zod/v3"]
  external string : unit -> schema = "string" [@@mel.module "zod/v3"]
  external number_ : unit -> schema = "number" [@@mel.module "zod/v3"]
  external null_ : unit -> schema = "null" [@@mel.module "zod/v3"]
  external enum_ : string array -> schema = "enum"
    [@@mel.module "zod/v3"]
  external union_ : schema array -> schema = "union"
    [@@mel.module "zod/v3"]
  external array : schema -> schema = "array" [@@mel.module "zod/v3"]
  external object_ : Js.Json.t -> schema = "object"
    [@@mel.module "zod/v3"]
  external optional : schema -> schema = "optional" [@@mel.send]
  external describe : schema -> string -> schema = "describe"
    [@@mel.send]
  external passthrough : schema -> schema = "passthrough" [@@mel.send]
end

external console_error : 'a array -> unit = "error"
  [@@mel.scope "console"] [@@mel.variadic]

external get_index : 'a -> string -> 'b Js.Undefined.t = ""
  [@@mel.get_index]

external promise_error_as_exn : Js.Promise.error -> exn = "%identity"

(* Stores transports by session ID *)
let transports :
    (string, Electron_mcp_transport.transport) Hashtbl.t =
  Hashtbl.create 8

(* api-fn — the bridge into invoke-logseq-api! supplied by
   Electron_server: (method-string, args-json) -> response-json. *)
type api_fn = string -> Js.Json.t -> Js.Json.t Js.Promise.t

let js_obj (kvs : (string * Js.Json.t) list) : Js.Json.t =
  let d = Js.Dict.empty () in
  List.iter (fun (k, v) -> Js.Dict.set d k v) kvs;
  Js.Json.object_ d

let arg (args : Js.Json.t) (name : string) : Js.Json.t =
  match Js.Undefined.toOption (get_index args name) with
  | Some v -> v
  | None -> Js.Json.null

let session_id_of_headers (req : Electron_mcp_transport.request)
    : string option =
  match
    Js.Undefined.toOption
      (get_index
         (Electron_mcp_transport.req_headers req)
         "mcp-session-id")
  with
  | Some v -> Js.Json.decodeString v
  | None -> None

(* ---------- MCP responses ---------- *)

let text_response (text : string) : Js.Json.t =
  js_obj
    [ ( "content"
      , Js.Json.array
          [| js_obj
               [ ("type", Js.Json.string "text")
               ; ("text", Js.Json.string text)
               ]
          |] )
    ]

let mcp_error_response (msg : string) : Js.Json.t = text_response msg

let mcp_success_response (data : Js.Json.t) : Js.Json.t =
  text_response (Js.Json.stringify data)

(* ---------- API tool fns ---------- *)

(* cljs: {:content [{:type "text" :text (str "Unexpected API error: " (ex-message error))}]} *)
let unexpected_api_error (error : Js.Promise.error) : Js.Json.t =
  text_response
    ("Unexpected API error: "
     ^ Electron_configs.exn_message (promise_error_as_exn error))

(* api-tool — call the API method and wrap the result as an MCP text
   response *)
let api_tool (api_fn : api_fn) (api_method : string)
    (method_args : Js.Json.t) : Js.Json.t Js.Promise.t =
  Js.Promise.catch
    (fun error -> Js.Promise.resolve (unexpected_api_error error))
    (Js.Promise.then_
       (fun body ->
         let error =
           match Js.Undefined.toOption (get_index body "error") with
           | Some v -> (
               match Js.Json.classify v with
               | Js.Json.JSONNull -> None
               | _ -> (
                   match Js.Json.decodeString v with
                   | Some s -> Some s
                   | None -> Some (Js.Json.stringify v)))
           | None -> None
         in
         match error with
         | Some e ->
             Js.Promise.resolve (mcp_error_response ("API Error: " ^ e))
         | None -> Js.Promise.resolve (mcp_success_response body))
       (api_fn api_method method_args))

let api_get_page call_api args =
  call_api "logseq.cli.getPageData"
    (Js.Json.array [| arg args "pageName" |])

let api_list_pages call_api args =
  call_api "logseq.cli.listPages"
    (Js.Json.array [| js_obj [ ("expand", arg args "expand") ] |])

let api_list_tags call_api args =
  call_api "logseq.cli.listTags"
    (Js.Json.array [| js_obj [ ("expand", arg args "expand") ] |])

let api_list_properties call_api args =
  call_api "logseq.cli.listProperties"
    (Js.Json.array [| js_obj [ ("expand", arg args "expand") ] |])

let api_search_blocks call_api args =
  call_api "logseq.app.search"
    (Js.Json.array
       [| arg args "searchTerm"
        ; js_obj [ ("enable-snippet?", Js.Json.boolean false) ]
       |])

let api_upsert_nodes call_api args =
  call_api "logseq.cli.upsertNodes"
    (Js.Json.array
       [| arg args "operations"
        ; js_obj [ ("dry-run", arg args "dry-run") ]
       |])

type call_api = string -> Js.Json.t -> Js.Json.t Js.Promise.t

type tool_fn = call_api -> Js.Json.t -> Js.Json.t Js.Promise.t

(* api-tools — "MCP Tools when calling API server" *)
let api_tools : (string * tool_fn * Js.Json.t) list =
  [ ( "listPages"
    , api_list_pages
    , js_obj
        [ ("title", Js.Json.string "List Pages")
        ; ("description", Js.Json.string "List all pages in a graph")
        ; ( "inputSchema"
          , js_obj
              [ ( "expand"
                , Z.describe
                    (Z.optional (Z.boolean ()))
                    "Provide additional detail on each page" )
              ] )
        ] )
  ; ( "getPage"
    , api_get_page
    , js_obj
        [ ("title", Js.Json.string "Get Page")
        ; ( "description"
          , Js.Json.string
              "Get a page's content including its blocks. A property \
               and a tag are pages." )
        ; ( "inputSchema"
          , js_obj
              [ ( "pageName"
                , Z.describe (Z.string ())
                    "The page's name or uuid" )
              ] )
        ] )
  ; ( "upsertNodes"
    , api_upsert_nodes
    , js_obj
        [ ("title", Js.Json.string "Upsert Nodes")
        ; ( "description"
          , Js.Json.string
              "This tool must be called at most once per user \
               request. Never re-call it unless explicitly asked.\n\
              \          It takes an object with field :operations, \
               which is an array of operation objects.\n\
              \          Each operation creates or edits a page, \
               block, tag or property. Each operation is a object\n\
              \          that must have :operation, :entityType and \
               :data fields. More about fields in an operation \
               object:\n\
              \            * :operation  - Either :add or :edit\n\
              \            * :entityType - What type of node, e.g. \
               :block, :page, :tag or :property\n\
              \            * :id - For :edit, this _must_ be a string \
               uuid. For :add, use a temporary unique string if the \
               new page is referenced by later operations e.g. add \
               blocks\n\
              \            * :data - A map of fields to set or update. \
               This map can have the following keys:\n\
              \              * :title - A page/tag/property's name or \
               a block's content\n\
              \              * :page-id - A page string uuid of a \
               block. Required when adding a block.\n\
              \              * :tags - A list of tags as string uuids\n\
              \              * :property-type - A property's type\n\
              \              * :property-cardinality - A property's \
               cardinality. Must be :one or :many\n\
              \              * :property-classes - A property's list \
               of allowed tags, each being a uuid string or a tag's \
               name\n\
              \              * :class-extends - List of parent tags, \
               each being a uuid string or a tag's name\n\
              \              * :class-properties - A tag's list of \
               properties, each eing a uuid string or a property's \
               name\n\
              \n\
              \         Example inputs with their prompt, description \
               and data as clojure EDN:\n\
              \n\
              \         Description: This input adds a new block to \
               page with id '119268a6-704f-4e9e-8c34-36dfc6133729' and \
               update the title of a page with uuid \
               '119268a6-704f-4e9e-8c34-36dfc6133729':\n\
              \n\
              \         {:operations\n\
              \          [{:operation :add\n\
              \            :entityType :block\n\
              \            :id nil\n\
              \            :data {:page-id \
               \"119268a6-704f-4e9e-8c34-36dfc6133729\"\n\
              \                   :title \"New block text\"}}\n\
              \           {:operation :edit\n\
              \            :entity :page\n\
              \            :id \
               \"119268a6-704f-4e9e-8c34-36dfc6133729\"\n\
              \            :data {:title \"Revised page title\"}}]}\n\
              \n\
              \        Prompt: Add task 't1' to new page 'Inbox'\n\
              \        Description: This input creates a page 'Inbox' \
               and adds a 't1' block with tag \
               \"00000002-1282-1814-5700-000000000000\" (task) to it:\n\
              \n\
              \        {:operations\n\
              \          [{:operation :add\n\
              \            :entityType :page\n\
              \            :id \"temp-Inbox\"\n\
              \            :data {:title \"Inbox\"}}\n\
              \           {:operation :add\n\
              \            :entityType :block\n\
              \            :data {:page-id \"temp-Inbox\"\n\
              \                   :title \"t1\"\n\
              \                   :tags \
               [\"00000002-1282-1814-5700-000000000000\"]}}]}\n\
              \n\
              \         Additional advice for building operations:\n\
              \         * Before creating any page, tag or property, \
               check that it exists with getPage" )
        ; ( "inputSchema"
          , js_obj
              [ ( "operations"
                , Z.array
                    (Z.object_
                       (js_obj
                          [ ( "operation"
                            , Z.enum_ [| "add"; "edit" |] )
                          ; ( "entityType"
                            , Z.enum_
                                [| "block"; "page"; "tag"; "property" |]
                            )
                          ; ( "id"
                            , Z.optional
                                (Z.union_
                                   [| Z.string ()
                                    ; Z.number_ ()
                                    ; Z.null_ ()
                                    |]) )
                          ; ( "data"
                            , Z.passthrough
                                (Z.object_
                                   (Js.Json.object_
                                      (Js.Dict.empty ()))) )
                          ])) )
              ; ( "dry-run"
                , Z.describe
                    (Z.optional (Z.boolean ()))
                    "Pretend to do batch update. Does everything \
                     except actually commit change to db e.g. \
                     validation." )
              ] )
        ] )
  ; ( "searchBlocks"
    , api_search_blocks
    , js_obj
        [ ("title", Js.Json.string "Search Blocks")
        ; ( "description"
          , Js.Json.string
              "Search graph for blocks containing search term" )
        ; ( "inputSchema"
          , js_obj [ ("searchTerm", Z.string ()) ] )
        ] )
  ; ( "listTags"
    , api_list_tags
    , js_obj
        [ ("title", Js.Json.string "List Tags")
        ; ("description", Js.Json.string "List all tags in a graph")
        ; ( "inputSchema"
          , js_obj
              [ ( "expand"
                , Z.describe
                    (Z.optional (Z.boolean ()))
                    "Provide additional detail on each tag e.g. their \
                     parents (extends) and tag properties" )
              ] )
        ] )
  ; ( "listProperties"
    , api_list_properties
    , js_obj
        [ ("title", Js.Json.string "List Properties")
        ; ( "description"
          , Js.Json.string "List all properties in a graph" )
        ; ( "inputSchema"
          , js_obj
              [ ( "expand"
                , Z.describe
                    (Z.optional (Z.boolean ()))
                    "Provide additional detail on each property e.g. \
                     property type, cardinality" )
              ] )
        ] )
  ]

(* call-api-tool *)
let call_api_tool (tool_fn : tool_fn) (api_fn : api_fn)
    (args : Js.Json.t) : Js.Json.t Js.Promise.t =
  tool_fn (api_tool api_fn) args

(* Server fns
   ========== *)

(* create-mcp-server *)
let create_mcp_server () : Sdk.mcp_server =
  Sdk.mcp_server_make
    [%mel.obj { name = "Logseq MCP Server"; version = "0.1.0" }]

(* create-mcp-api-server *)
let create_mcp_api_server (api_fn : api_fn) : Sdk.mcp_server =
  let mcp_server = create_mcp_server () in
  List.iter
    (fun (name, tool_fn, config) ->
      Sdk.register_tool mcp_server name config (fun [@u] args ->
          call_api_tool tool_fn api_fn args))
    api_tools;
  mcp_server

(* ---------- server util fns ---------- *)

(* handle-post-request — session-routed POST /mcp *)
let handle_post_request (api_fn : api_fn) ~(port : int)
    ~(host : string) (req : Electron_mcp_transport.request)
    (res : Electron_mcp_transport.reply) : unit =
  let session_id = session_id_of_headers req in
  let existing =
    Option.bind session_id (fun id -> Hashtbl.find_opt transports id)
  in
  let body =
    Option.value (Electron_mcp_transport.req_body req)
      ~default:Js.Json.null
  in
  Js.log "POST /mcp request";
  match existing with
  | Some transport ->
      Electron_mcp_transport.handle_request_with_body transport req res
        body
  | None ->
      if session_id = None && Sdk.is_initialize_request body then (
        let transport =
          Sdk.transport_make
            [%mel.obj
              { sessionIdGenerator = (fun () -> Uuid_gen.uuid ())
              ; enableDnsRebindingProtection = true
              ; allowedHosts = [| host ^ ":" ^ string_of_int port |]
              }]
        in
        let mcp_server = create_mcp_api_server api_fn in
        Sdk.set_onclose transport (fun () ->
            let sid = Sdk.session_id transport in
            Js.log "Transport closed";
            (match sid with
             | Some id -> Hashtbl.remove transports id
             | None -> ()));
        ignore (Sdk.connect mcp_server transport);
        Electron_mcp_transport.handle_request_with_body transport req
          res body;
        match Sdk.session_id transport with
        | Some id ->
            Js.log ("Initialize sessionId " ^ id);
            Hashtbl.replace transports id transport
        | None -> console_error [| "No sessionId to initialize!" |])
      else
        ignore
          (Electron_mcp_transport.reply_send
             (Electron_mcp_transport.reply_code res 400)
             (js_obj
                [ ("jsonrpc", Js.Json.string "2.0")
                ; ( "error"
                  , js_obj
                      [ ("code", Js.Json.number (-32000.))
                      ; ( "message"
                        , Js.Json.string
                            "Bad Request: No valid session ID provided"
                        )
                      ] )
                ; ("id", Js.Json.null)
                ]))

(* handle-get-request *)
let handle_get_request (req : Electron_mcp_transport.request)
    (res : Electron_mcp_transport.reply) : unit =
  Js.log "GET /mcp";
  match
    Option.bind (session_id_of_headers req)
      (Hashtbl.find_opt transports)
  with
  | Some transport ->
      Electron_mcp_transport.handle_request transport req res
  | None ->
      ignore
        (Electron_mcp_transport.reply_send
           (Electron_mcp_transport.reply_code res 400)
           "Invalid or missing session ID")

(* handle-delete-request *)
let handle_delete_request (req : Electron_mcp_transport.request)
    (res : Electron_mcp_transport.reply) : unit =
  Js.log "DELETE /mcp";
  match
    Option.bind (session_id_of_headers req)
      (Hashtbl.find_opt transports)
  with
  | Some transport ->
      Sdk.transport_close transport;
      ignore
        (Electron_mcp_transport.reply_send
           (Electron_mcp_transport.reply_code res 200)
           (js_obj [ ("ok", Js.Json.boolean true) ]))
  | None ->
      ignore
        (Electron_mcp_transport.reply_send
           (Electron_mcp_transport.reply_code res 400)
           "Invalid or missing session ID")

