open Lui_elements

type owner = { scope : string; container : string }

let owner ~scope ~container = { scope; container }

type target =
  { id : string; owner : owner; serial : int; activate : unit -> unit }

include State_cell.Make (struct
  type t = (string * string) list
  let name = "jump"
end)

let targets : (string, target) Hashtbl.t = Hashtbl.create 64
let next_serial = ref 0
let capture : Signal.scope option ref = ref None

let exit () =
  Option.iter Signal.dispose_scope !capture;
  capture := None;
  if ready () then set (fun _ -> [])

let target ?(enabled = true) ~key ~owner:target_owner ~activate child : t =
 fun ctx parent ->
  if not enabled then child ctx parent else begin
    if not (ready ()) then mount ctx [];
    incr next_serial;
    let id = target_owner.container ^ ":" ^ key ^ ":" ^ string_of_int !next_serial in
    let target = {id; owner = target_owner; serial = !next_serial; activate} in
    Hashtbl.replace targets id target;
    Signal.on_dispose ctx.Lui_ui.ui_scope (fun () ->
      (match Hashtbl.find_opt targets id with
       | Some current when current == target -> Hashtbl.remove targets id
       | _ -> ());
      if List.mem_assoc id (value ()) then exit ());
    overlay ~grow:1. ~alignment:`leading
      [ child
      ; reactive (fun assignments ->
          match List.assoc_opt id assignments with
          | None -> Logseq_el.nothing
          | Some hint ->
              text ~style_class:"jtrigger-id" ~value:hint
                ~font_size:"0.875rem" ~padding_horizontal:4
                ~background:"var(--ls-primary-background-color)"
                ~foreground:"var(--ls-primary-text-color)"
                ~border_color:"var(--ls-border-color)" ~border_width:1
                ~corner_radius:3 []) (signal ())
      ] ctx parent
  end

let letters = ["a"; "s"; "d"; "f"; "g"; "h"; "q"; "w"; "e"; "r"; "t";
  "y"; "u"; "i"; "o"; "p"; "z"; "x"; "c"; "v"; "b"; "n"; "m"]

let hints = letters @ List.concat_map (fun prefix ->
    List.map (fun suffix -> prefix ^ suffix) letters) ["j"; "k"; "l"]

let start ~owner:current_owner ~rank ~clear_selection () =
  if !capture = None && ready () && not (Keyboard_capture.active ()) then begin
    let candidates = Hashtbl.fold (fun _ target acc ->
        if Option.fold ~none:true ~some:((=) target.owner) current_owner
        then target :: acc else acc) targets []
      |> List.sort (fun a b ->
          match Int.compare (rank a.owner.container) (rank b.owner.container) with
          | 0 -> Int.compare a.serial b.serial
          | order -> order) in
    let rec assign hints targets = match hints, targets with
      | hint :: hints, target :: targets -> (hint, target) :: assign hints targets
      | _ -> [] in
    let assigned = assign hints candidates in
    if assigned <> [] then begin
      let scope = Signal.scope "editor-jump" in
      let chord = ref "" in
      capture := Some scope;
      set (fun _ -> List.map (fun (hint, target) -> target.id, hint) assigned);
      Keyboard_capture.acquire ~scope (fun ev ->
        let key = Option.fold ~none:"" ~some:String.lowercase_ascii ev.Ui_services.key in
        if key = "escape" then exit ()
        else if List.mem key (letters @ ["j"; "k"; "l"]) then begin
          chord := !chord ^ key;
          let selected = List.assoc_opt !chord assigned in
          if selected <> None || String.length !chord >= 2 then begin
            clear_selection ();
            exit ();
            match selected with
            | Some target -> target.activate ()
            | None -> Toast.error (I18n.t "nav/invalid-jump-error")
          end
        end)
    end
  end
