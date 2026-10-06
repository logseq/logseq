(* editor_probe — scaling + mechanism probe behind the editor_bench
   numbers. See docs/editor-perf.md. *)

module M = Edit_model

external perf_now : unit -> float = "now" [@@mel.scope "performance"]

let mk n =
  let b = Buffer.create (n * 64) in
  for i = 0 to n - 1 do
    (match i mod 9 with
     | 3 -> Printf.bprintf b "Line %04d has **bold phrase** and more\n" i
     | 5 -> Printf.bprintf b "Line %04d links [[Page %02d]] tail\n" i (i mod 50)
     | 7 -> Printf.bprintf b "Line %04d tags #topic and `code` here\n" i
     | _ -> Printf.bprintf b "Line %04d plain text with some words\n" i)
  done;
  Buffer.contents b

let () =
  let src = mk 500 in
  let n = String.length src in
  Js.log (Printf.sprintf "corpus %dB" n);
  (* index_from: one call per needle hit *)
  let t0 = perf_now () in
  let rec count lo k =
    match Str_util.index_from src lo "\n" with
    | Some i -> count (i + 1) (k + 1)
    | None -> k
  in
  let lines = count 0 0 in
  Js.log (Printf.sprintf "index_from scan: %d lines %.1fms" lines (perf_now () -. t0));
  (* same scan with stdlib String.index_from *)
  let t0 = perf_now () in
  let rec count2 lo k =
    try count2 (String.index_from src lo '\n' + 1) (k + 1)
    with Not_found -> k
  in
  let lines2 = count2 0 0 in
  Js.log (Printf.sprintf "String.index_from scan: %d lines %.1fms" lines2 (perf_now () -. t0));
  (* single worst-case index_from call: scan a whole mid-buffer gap *)
  let t0 = perf_now () in
  ignore (Str_util.index_from src 0 "zzz-not-found");
  Js.log (Printf.sprintf "index_from miss (full 26KB scan): %.1fms" (perf_now () -. t0));
  (* full model pipeline pieces *)
  let t0 = perf_now () in
  ignore (M.lines_of_source src);
  Js.log (Printf.sprintf "lines_of_source: %.1fms" (perf_now () -. t0));
  let t0 = perf_now () in
  ignore (Edit_runs.runs src);
  Js.log (Printf.sprintf "runs: %.1fms" (perf_now () -. t0));
  let m = M.create src in
  let t0 = perf_now () in
  ignore (Edit_view.lines_of m);
  Js.log (Printf.sprintf "lines_of: %.1fms" (perf_now () -. t0))
