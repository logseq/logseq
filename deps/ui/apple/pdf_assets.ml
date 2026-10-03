(* Native twin — asset inflation for the PDFKit viewer: resolves the
   on-disk assets/<uuid>.<ext> path instead of pfs object URLs. *)

let t = Logseq_dom.dom ~tag:"raw-text" []

(* cljs inflate_asset — the pdf_asset record the viewer opens on *)
let inflate ~uuid ~db_id ~external_url ~path : Model.pdf_asset =
  let n = String.length path in
  { Model.pdf_key = path
  ; pdf_block_uuid = uuid
  ; pdf_block_db_id = db_id
  ; pdf_block_external_url = external_url
  ; pdf_identity =
      (if n > 15 then String.sub path (n - 15) 15 else path)
  ; pdf_filename = Filename.basename path
  ; pdf_url = path
  ; pdf_original_path = path
  }

(* cljs open_pdf_file — an asset block's open affordance *)
let open_pdf_file ~uuid ~ext ~(b : Model.block) : unit =
  let path =
    Filename.concat
      (Asset_store.asset_dir (Runtime.repo ()))
      (uuid ^ "." ^ ext)
  in
  Pdf_state.set_current
    (Some
       (inflate ~uuid:b.Model.block_uuid ~db_id:b.block_db_id
          ~external_url:b.Model.block_asset_url ~path))
