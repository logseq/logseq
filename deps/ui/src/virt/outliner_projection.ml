(* Logical rows exist independently of viewport mounting. Projection scopes
   identify interaction owners; they do not create nested viewport owners. *)

type section =
  { section_key : string
  ; repository : string option
  ; scope : string
  ; page : Model.page
  }

type ancestor = { ancestor_block : Model.block; ancestor_scope : string }

type block_row =
  { block : Model.block
  ; scope : string
  ; section : section
  ; depth : int
  ; ancestors : ancestor list
  }

type row = Header of section | Block of block_row | Footer of section

type projection_source =
  { source_scope : string
  ; source_blocks : Model.block list
  }

type t =
  { rows : row list
  ; embedded_sources : projection_source list
  }

let scoped_key scope identity =
  string_of_int (String.length scope) ^ ":" ^ scope ^ ":" ^ identity

let block_identity (block : Model.block) =
  match block.block_uuid, block.block_db_id with
  | Some uuid, _ -> uuid
  | None, Some id -> "db:" ^ string_of_int id
  | None, None -> invalid_arg "Projected block has no stable identity"

let repository_key section identity =
  let repository = match section.repository with None -> "0" | Some repo -> "1" ^ repo in
  scoped_key repository identity

let key = function
  | Header section -> "header:" ^ repository_key section (scoped_key section.scope section.section_key)
  | Footer section -> "footer:" ^ repository_key section (scoped_key section.scope section.section_key)
  | Block row -> "block:" ^ repository_key row.section (scoped_key row.scope (block_identity row.block))

let embedded_scope ~scope block =
  "embed:" ^ scoped_key scope (block_identity block)

(* Domain paths include collapsed descendants. Ancestors are expansion
   metadata only; the viewport still retains exactly one projected row. *)
let find_path ~children_of ~scope ~uuid (sections : section list) =
  let requested_scope = scope in
  let rec blocks ~exact scope ancestors = function
    | [] -> None
    | (block : Model.block) :: rest ->
        let path = {ancestor_block = block; ancestor_scope = scope} :: ancestors in
        if block.block_uuid = Some uuid && (not exact || scope = requested_scope) then Some path
        else
          let children = children_of block in
          let child_scope = match block.block_link, children with
            | Some _, _ :: _ -> embedded_scope ~scope block
            | _ -> scope in
          (match blocks ~exact child_scope path children with
           | Some _ as found -> found
           | None -> blocks ~exact scope ancestors rest)
  in
  let preferred, others = List.partition (fun (section : section) -> section.scope = scope) sections in
  let in_sections ~exact = List.find_map (fun (section : section) ->
    blocks ~exact section.scope [] section.page.Model.page_blocks) in
  let search ~exact = match in_sections ~exact preferred with
    | Some _ as found -> found
    | None -> in_sections ~exact others in
  (* A preceding embed must not shadow the requested main/zoom occurrence
     in a later journal section. Fall back only when that scope has none. *)
  match search ~exact:true with Some _ as found -> found | None -> search ~exact:false

let create ~expanded ~children_of (sections : section list) =
  let keys = Hashtbl.create 128 in
  let embedded_sources = ref [] in
  let push row reversed =
    let row_key = key row in
    if Hashtbl.mem keys row_key then
      invalid_arg ("Duplicate projected occurrence: " ^ row_key);
    Hashtbl.add keys row_key ();
    row :: reversed
  in
    let rec blocks ~section ~scope ~depth ~ancestors reversed = function
    | [] -> reversed
    | (block : Model.block) :: rest ->
          let reversed = push (Block {block; scope; section; depth; ancestors}) reversed in
        let reversed =
          if not (expanded ~scope block) then reversed
          else
            let children = children_of block in
            let child_scope =
              match block.block_link, children with
              | Some _, _ :: _ ->
                  let source_scope = embedded_scope ~scope block in
                  embedded_sources := {source_scope; source_blocks = children} :: !embedded_sources;
                  source_scope
              | _ -> scope
            in
              blocks ~section ~scope:child_scope ~depth:(depth + 1)
                     ~ancestors:({ancestor_block = block; ancestor_scope = scope} :: ancestors)
                     reversed children
        in
          blocks ~section ~scope ~depth ~ancestors reversed rest
  in
  let reversed = List.fold_left (fun reversed (section : section) ->
    let reversed = push (Header section) reversed in
        let reversed = blocks ~section ~scope:section.scope
      ~depth:0 ~ancestors:[] reversed section.page.Model.page_blocks in
    push (Footer section) reversed) [] sections in
  {rows = List.rev reversed; embedded_sources = List.rev !embedded_sources}

(* Lookup runs for an explicit navigation intent, before DOM polling. Its
   index counts all logical rows, including section boundaries. *)
let find_block projection ~scope ~uuid =
  let rec find index = function
    | [] -> None
    | Block row :: _ when row.scope = scope && row.block.Model.block_uuid = Some uuid ->
        Some (index, row)
    | _ :: rest -> find (index + 1) rest
  in
  find 0 projection.rows
