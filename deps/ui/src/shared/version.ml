(* App version generated once from resources/package.json. *)

let app = Version_gen.app

(* Build revision generated with the app version. Platform bootstraps may
   replace it with their own injection (vite define LOGSEQ_REVISION on the
   web, LOGSEQ_REVISION env on native). *)
let revision_ref = ref Version_gen.revision

let set_revision r = revision_ref := r

let revision () = !revision_ref
