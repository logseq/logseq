type timer = { mutable cancelled : bool }

let set_timeout ms f =
  let t = { cancelled = false } in
  ignore
    (Thread.create
       (fun () ->
          ignore (Unix.select [] [] [] (float_of_int ms /. 1000.));
          if not t.cancelled then f ())
       ());
  t

let set_interval ms f =
  let t = { cancelled = false } in
  ignore
    (Thread.create
       (fun () ->
          while not t.cancelled do
            ignore (Unix.select [] [] [] (float_of_int ms /. 1000.));
            if not t.cancelled then f ()
          done)
       ());
  t

let clear t = t.cancelled <- true
