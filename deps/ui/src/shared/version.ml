(* App version generated once from resources/package.json. *)

let app = Version_gen.app

(* Build revision injected by the platform's bootstrap (vite define
   LOGSEQ_REVISION on the web, LOGSEQ_REVISION env on native); empty
   when built outside the bundle pipeline. *)
let revision_ref = ref ""

let set_revision r = revision_ref := r

let revision () = !revision_ref
