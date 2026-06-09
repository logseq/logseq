Melange_edn.of_edn_string {|{:aaa 11}|}
|> Melange_edn.to_edn_string |> print_string
;;

Melange_edn.of_edn_string {|{:aaa 11}|}
|> Melange_edn.to_json_string |> print_string
