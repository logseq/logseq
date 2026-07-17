type content_source = Title | Value

let is_property_created_block ~is_map ~has_created_from_property ~has_page
    ~has_content =
  is_map && has_created_from_property && has_page && not has_content

let is_many cardinality = String.equal cardinality "db.cardinality/many"
let select_content_source ~title_truthy = if title_truthy then Title else Value
