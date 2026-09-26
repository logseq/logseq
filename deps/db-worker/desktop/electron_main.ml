(* Desktop main-process entry. Replaces the shadow-cljs :electron
   node-script (electron.core/main). *)

open Electron_bindings

let create_window () =
  let win =
    Browser_window.make
      [%mel.obj
        { width = 1280
        ; height = 800
        ; webPreferences = [%mel.obj { preload = "preload.js" }] }]
  in
  Electron_state.main_window := Some win;
  ignore
    (Browser_window.load_url win
       (if Electron_state.dev
        then "http://localhost:3001"
        else "file://" ^ Node.Path.join [| Node.Process.cwd (); "index.html" |])
       None);
  win

let main () =
  App.set_name App.t "Logseq";
  ignore
    (Js.Promise.then_
       (fun () ->
          ignore (create_window ());
          Js.Promise.resolve ())
       (App.when_ready App.t))
