type extend = { title : string option; built_in : bool }

val class_title_with_extends :
  stored_title:string option ->
  extend Rrbvec.t ->
  display_title:string option ->
  string option

val unique_title :
  built_in:bool ->
  stored_title:string option ->
  class_:bool ->
  class_conflict:bool ->
  extends:extend Rrbvec.t ->
  display_title:string option ->
  truncate:bool ->
  tag_titles:string Rrbvec.t ->
  alias:string option ->
  string option
