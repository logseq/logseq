(* Native twin — the pdf viewer is a declarative logseq-pdf extension
   element inside #app-single-container (PDFKit on the Swift side),
   instead of the imperative pdf.js portal. S.open_request pushes the
   asset into a signal the chrome's container reads. *)

let current_sig : Model.pdf_asset option Signal.state option ref =
  ref None

(* created lazily inside the view where ui_scheduler exists; before
   that, set_current's write to S.current is picked up on first read *)
let asset_signal context : Model.pdf_asset option Signal.signal =
  match !current_sig with
  | Some s -> s.Signal.state_signal
  | None ->
      let s =
        Signal.state context.Lui_ui.ui_scheduler !Pdf_state.current
      in
      current_sig := Some s;
      s.Signal.state_signal

let viewer_el : Lui_elements.t =
 fun context parent ->
  Logseq_dom.dyn
    ~equal:(fun (a : Model.pdf_asset option) b ->
      match a, b with
      | Some x, Some y -> x.pdf_identity = y.pdf_identity
      | None, None -> true
      | _ -> false)
    (fun ao ->
      match ao with
      | None -> Logseq_dom.nothing
      | Some a ->
          Logseq_dom.dom ~tag:"pdf"
            ~style_class:"w-full h-full"
            ~events:"pdf-close"
            ~on_dom_event:(fun name _ ->
              if name = "pdf-close" then Pdf_state.set_current None)
            ~attrs:
              [ ("path", a.Model.pdf_url)
              ; ("filename", a.Model.pdf_filename)
              ]
            [])
    (asset_signal context)
    context parent

(* the sibling of #left-container in #app-container: grows to take the
   right half only while a pdf is open *)
let container_el ~key ~id : Lui_elements.t =
 fun context parent ->
  Logseq_dom.dom ~key ~id
    ~style_class_signal:
      (Logseq_dom.class_signal
         (asset_signal context)
         (fun ao -> if Option.is_some ao then "grow" else ""))
    [ viewer_el ] context parent

let install () =
  Pdf_state.open_request :=
    (fun a ->
      match !current_sig with
      | Some s -> Runtime.signal_set s a
      | None -> ())
