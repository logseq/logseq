let output program =
  Wire.Array (List.map (function
    | Plugin_protocol.Insert_text text -> Wire.Array [Wire.kw "editor/input"; Wire.str text]
    | Plugin_protocol.Show_date_picker -> Wire.Array [Wire.kw "editor/show-date-picker"]
    | Plugin_protocol.Exit_editing -> Wire.Array [Wire.kw "editor/exit"])
    (Plugin_protocol.actions program))
