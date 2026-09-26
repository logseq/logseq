(* Port of src/electron/electron/find_in_page.cljs — find-in-page
   plumbing that forwards results to the renderer over IPC. *)

open Electron_bindings

let find (window : Browser_window.t Js.Null.t) (search : string)
    (option : 'a) : bool =
  match Js.Null.toOption window with
  | None -> false
  | Some window ->
      let contents = Browser_window.web_contents window in
      ignore (web_contents_find_in_page contents search option);
      (* cljs registers a fresh listener per find! call; kept faithful. *)
      web_contents_on2 contents "found-in-page"
        (fun [@u] _event (result : Js.Json.t) ->
          Electron_utils.send_to_window window "foundInPage"
            [| result |]);
      true

let clear (window : Browser_window.t Js.Null.t) : unit =
  match Js.Null.toOption window with
  | Some window ->
      web_contents_stop_find_in_page
        (Browser_window.web_contents window)
        "clearSelection"
  | None -> ()
