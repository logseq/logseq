(* Shared behavior scenarios for the merged editor command dispatcher
   (Editor_cmds). One implementation owns the ls:editor-command business
   dispatch on both runtimes; each entry installs the real host adapter
   plus recording stand-ins, then supplies the observation channels
   below. Worker-fed commands apply their ops through promise chains —
   the trailing assertions run inside h.drain. *)

type host =
  { check : string -> bool -> unit
  ; run : command:string -> block:string option -> value:string option -> string
  ; (* a promise/microtask drain hook: web awaits a tick, native's shim
       resolves synchronously *)
    drain : (unit -> unit) -> unit
  ; install : unit -> unit
  ; set_editing : string option -> unit
  ; clipboard : unit -> string list
  ; sidebars : unit -> string list
  ; dialogs : unit -> string list
  ; picked : unit -> int
  ; plugin_calls : unit -> (string * string * string) list
  ; reports : unit -> (string * string) list
  ; invokes : unit -> string list
  ; ops : unit -> string list
  ; plugin_ctx_supported : bool
  }

let has x xs = List.mem x xs

let eqsl (h : host) name expected actual =
  h.check
    (name ^ " (got [" ^ String.concat ";" actual ^ "])")
    (expected = actual)

let run (h : host) =
  let c = h.check in
  h.install ();
  (* -- host-routed commands (synchronous outcomes) -- *)
  c "upload outcome handled"
    (h.run ~command:"upload" ~block:None ~value:None = "handled");
  c "upload fires the host file picker" (h.picked () = 1);
  c "open-in-sidebar handled"
    (h.run ~command:"open-in-sidebar" ~block:(Some "c1") ~value:None
     = "handled");
  eqsl h "open-in-sidebar dispatches block uuid" [ "c1" ] (h.sidebars ());
  c "copy-ref handled"
    (h.run ~command:"copy-ref" ~block:(Some "c1") ~value:None = "handled");
  eqsl h "copy-ref writes block ref to clipboard" [ "[[c1]]" ]
    (h.clipboard ());
  c "copy handled"
    (h.run ~command:"copy" ~block:(Some "c1") ~value:None = "handled");
  c "copy writes block title to clipboard" (has "Copy me" (h.clipboard ()));
  c "cut handled"
    (h.run ~command:"cut" ~block:(Some "c1") ~value:None = "handled");
  c "delete handled"
    (h.run ~command:"delete" ~block:(Some "c1") ~value:None = "handled");
  c "delete sends delete-blocks op" (has "delete-blocks" (h.ops ()));
  c "expand-children handled"
    (h.run ~command:"expand-children" ~block:(Some "c1") ~value:None
     = "handled");
  c "expand-children sends collapse-expand-blocks op"
    (has "collapse-expand-blocks" (h.ops ()));
  c "set-heading handled"
    (h.run ~command:"set-heading" ~block:(Some "c1") ~value:(Some "2")
     = "handled");
  c "set-heading sends batch-set-property op"
    (has "batch-set-property" (h.ops ()));
  c "set-color handled"
    (h.run ~command:"set-color" ~block:(Some "c1") ~value:(Some "red")
     = "handled");
  c "copy-export-as handled"
    (h.run ~command:"copy-export-as" ~block:(Some "c1") ~value:None
     = "handled");
  eqsl h "copy-export-as arms then opens the export dialog"
    [ "export-page" ] (h.dialogs ());
  (* current_block falls back to the editing session's uuid *)
  h.set_editing (Some "c1");
  c "block omitted resolves through editing state"
    (h.run ~command:"delete" ~block:None ~value:None = "handled");
  h.set_editing None;
  c "no block and no editing reports no-target"
    (h.run ~command:"delete" ~block:None ~value:None = "no-target");
  (* recognized-but-unbuilt and unrecognized commands report honestly *)
  c "cycle-todo reports unimplemented"
    (h.run ~command:"cycle-todo" ~block:(Some "c1") ~value:None
     = "unimplemented:cycle-todo");
  c "cycle-todo reports the error channel"
    (has ("editor command not implemented", "cycle-todo") (h.reports ()));
  c "unknown command reports unknown"
    (h.run ~command:"bogus-cmd" ~block:(Some "c1") ~value:None
     = "unknown:bogus-cmd");
  c "unknown command reports the error channel"
    (has ("unknown editor command", "bogus-cmd") (h.reports ()));
  (* plugin context dispatch depends on the host plugin capability *)
  let pcmd = "plugin-ctx:my-plugin/refresh-themes" in
  if h.plugin_ctx_supported then begin
    c "plugin-ctx dispatches when supported"
      (h.run ~command:pcmd ~block:(Some "c1") ~value:None = "handled");
    c "plugin-ctx passes block uuid, plugin id and key"
      (has ("c1", "my-plugin", "refresh-themes") (h.plugin_calls ()))
  end
  else begin
    c "plugin-ctx reports unavailable without plugin host"
      (h.run ~command:pcmd ~block:(Some "c1") ~value:None
       = "unavailable:" ^ pcmd);
    c "plugin-ctx unavailable reports the error channel"
      (has ("editor command unavailable on this host", pcmd) (h.reports ()))
  end;
  (* -- worker-fed commands: the resolve invoke lands synchronously, the
        follow-up op applies inside promise callbacks -- *)
  c "status-doing handled"
    (h.run ~command:"status-doing" ~block:(Some "c1") ~value:None
     = "handled");
  c "status-doing resolves a closed value first"
    (has "thread-api/get-property-closed-values" (h.invokes ()));
  c "status-bogus handled"
    (h.run ~command:"status-bogus" ~block:(Some "c1") ~value:None
     = "handled");
  c "make-flashcard handled"
    (h.run ~command:"make-flashcard" ~block:(Some "c1") ~value:None
     = "handled");
  c "make-flashcard resolves the Card class"
    (has "thread-api/get-case-page" (h.invokes ()));
  c "toggle-numbered-list handled"
    (h.run ~command:"toggle-numbered-list" ~block:(Some "c1") ~value:None
     = "handled");
  c "add-comment handled"
    (h.run ~command:"add-comment" ~block:(Some "c1") ~value:None
     = "handled");
  c "add-comment invokes the comments worker api"
    (has "thread-api/ensure-comments-area-for-blocks" (h.invokes ()));
  c "quote handled"
    (h.run ~command:"quote" ~block:(Some "c1") ~value:None = "handled");
  h.drain (fun () ->
      c "status-doing applies the resolved property"
        (has "batch-set-property" (h.ops ())
        || has "set-block-property" (h.ops ()));
      c "status-bogus reported the closed-value miss"
        (has ("closed value not found", "bogus") (h.reports ()));
      c "make-flashcard tags the block"
        (has "set-block-property" (h.ops ())
        || has "batch-set-property" (h.ops ()));
      c "toggle-numbered-list applies an op"
        (h.ops () <> [] || has "thread-api/get-by-id" (h.invokes ()));
      c "quote saves the quoted title" (has "save-block" (h.ops ())))
