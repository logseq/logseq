(* Native twin of editor/html_to_md.ml — no DOMParser; plain-text paste
   extraction: strips tags and unescapes the common entities. Rich
   HTML->markdown fidelity is a follow-up. *)

let convert (html : string) : string option =
  let b = Buffer.create (String.length html) in
  let n = String.length html in
  let rec loop i =
    if i >= n then ()
    else
      match html.[i] with
      | '<' -> (
          (* skip to '>' *)
          match String.index_from_opt html i '>' with
          | Some j -> loop (j + 1)
          | None -> ())
      | '&' -> (
          let rest =
            try String.sub html i (min 8 (n - i)) with _ -> ""
          in
          if String.length rest >= 5 && String.sub rest 0 5 = "&amp;" then begin
            Buffer.add_char b '&';
            loop (i + 5)
          end
          else if String.length rest >= 4 && String.sub rest 0 4 = "&lt;" then begin
            Buffer.add_char b '<';
            loop (i + 4)
          end
          else if String.length rest >= 4 && String.sub rest 0 4 = "&gt;" then begin
            Buffer.add_char b '>';
            loop (i + 4)
          end
          else if String.length rest >= 6 && String.sub rest 0 6 = "&nbsp;" then begin
            Buffer.add_char b ' ';
            loop (i + 6)
          end
          else if String.length rest >= 6 && String.sub rest 0 6 = "&quot;" then begin
            Buffer.add_char b '"';
            loop (i + 6)
          end
          else begin
            Buffer.add_char b '&';
            loop (i + 1)
          end)
      | c ->
          Buffer.add_char b c;
          loop (i + 1)
  in
  loop 0;
  Some (Buffer.contents b)
