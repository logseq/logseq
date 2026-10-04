(** Locator combinators, mirroring clj-e2e's [locator.clj]. *)

let or_ env q1 q2 =
  Playwright.locator_or (Pw.q env q1) (Pw.q env q2)

let or_list env = function
  | [] -> failwith "or_list: empty"
  | q :: qs ->
      List.fold_left
        (fun acc q -> Playwright.locator_or acc (Pw.q env q))
        (Pw.q env q) qs

let and_ env q1 q2 =
  Playwright.locator_and (Pw.q env q1) (Pw.q env q2)

let filter env ?has ?has_not ?has_text ?has_not_text selector =
  Playwright.locator_filter ?has ?has_not ?has_text ?has_not_text
    (Pw.q env selector)
