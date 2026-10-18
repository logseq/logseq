(* JS entry for the Electron main process — the whole of
   src/electron/electron/** ported to OCaml. Emitted as
   static/electron.js by vite --mode electron; the package.json "main"
   field already points there. *)

let () = Electron_main.main ()
