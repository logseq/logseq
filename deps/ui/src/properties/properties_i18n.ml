(* Property UI strings. Source of truth is src/resources/dicts/en.edn;
   OCaml files sit outside .i18n-lint.toml scope (see
   .agents/skills/logseq-i18n), so — like Strings.ml — we keep the
   English literals here keyed by their en.edn names so a future t()
   loader is a drop-in replacement. *)

let t key =
  match key with
  | "property/add-new" -> "Add property"
  | "class/add-property" -> "Add tag property"
  | "property/set-property" -> "Set property"
  | "property/add-or-change" -> "Add or change property"
  | "property/select-property-placeholder" -> "Select a property"
  | "property/select-type-placeholder" -> "Select a property type"
  | "property/select-choice" -> "Select a choice"
  | "property/set-placeholder" -> "Set {1}"
  | "property/skip-choosing-tag" -> "Skip choosing tag"
  | "property/choose-tag" -> "Choose tag"
  | "property/choose-tags" -> "Choose tags"
  | "property/available-choices" -> "Available choices"
  | "property/add-choice" -> "Add choice"
  | "property/set-default-choice" -> "Set as default choice"
  | "property/hide-for-tag" -> "Hide for #{1}"
  | "property/hide-choice-for-tag" -> "Hide choice for this tag"
  | "property/remove-scope-for-tag" -> "Remove scope for #{1}"
  | "property/use-choice-in-tag" -> "Use choice in #{1}"
  | "property/scope-choice-to-tag" -> "Only for #{1}"
  | "property/delete-from-node" -> "Delete property from node"
  | "property/delete-from-node-confirm" ->
      "Are you sure you want to delete the property \"{1}\" from this node?"
  | "property/delete-from-tag" -> "Delete property from tag"
  | "property/delete-from-tag-confirm" ->
      "Are you sure you want to delete the property \"{1}\" from this tag?"
  | "property/hide-by-default" -> "Hide by default"
  | "property/hide-empty-value" -> "Hide empty value"
  | "property/multiple-values" -> "Multiple values"
  | "property/multiple-values-confirm" ->
      "This action cannot be undone. Do you want to change this property \
       to have multiple values?"
  | "property/show-hidden-choices" -> "Show hidden choices"
  | "property/hide-hidden-choices" -> "Hide hidden choices"
  | "property/ui-position" -> "UI position"
  | "property/ui-position-properties" -> "Block properties"
  | "property/ui-position-block-left" -> "Beginning of the block"
  | "property/ui-position-block-right" -> "End of the block"
  | "property/ui-position-block-below" -> "Below the block"
  | "property/name" -> "Property name"
  | "property/name-placeholder" -> "name"
  | "property/description-placeholder" -> "description"
  | "property/type" -> "Property type"
  | "property/type-text" -> "Text"
  | "property/type-default" -> "Text"
  | "property/type-number" -> "Number"
  | "property/type-date" -> "Date"
  | "property/type-datetime" -> "DateTime"
  | "property/type-checkbox" -> "Checkbox"
  | "property/type-url" -> "URL"
  | "property/type-node" -> "Node"
  | "property/type-asset" -> "Asset"
  | "property/specify-node-tags" -> "Specify node tags"
  | "property/default-value" -> "Default value"
  | "property/set-default-value" -> "Set default value"
  | "property/go-to-this-property" -> "Go to this property"
  | "property/title-placeholder" -> "title"
  | "property/create-error" ->
      "Property failed to create. Please try a different property name."
  | "property/invalid-name-error" ->
      "invalid property name, please rename the property" (* en.edn
         :property.validation/invalid-name carries this sentence *)
  | "property/more-settings" -> "More settings"
  | "property/existing-values" -> "Existing values:"
  | "property/add-choices" -> "Add choices"
  | "property/drag-to-reorder" -> "Drag && Drop to reorder"
  | "property/set-icon" -> "Set Icon"
  | "property/checkbox-state-mapping" -> "Checkbox state mapping"
  | "property/choices-count" -> "{1} choices"
  | "property/change-tooltip" -> "Change {1}"
  | "property/show-hidden-properties" -> "Show hidden properties"
  | "property/collapse-hidden-properties" -> "Collapse hidden properties"
  | "property/configure" -> "Configure property"
  | "property/configure-title" -> "Configure"
  | "ui/confirm" -> "Confirm"
  | "ui/cancel" -> "Cancel"
  | "ui/save" -> "Save"
  | "ui/delete" -> "Delete"
  | "ui/empty" -> "Empty"
  | "ui/new" -> "New"
  | "ui/true" -> "true"
  | "ui/false" -> "false"
  | "select/new-option" -> "New option:"
  | "search-result-item/new-page" -> "Create page called '{1}'"
  | _ -> key

(* Substitute {1} placeholders in the template. *)
let sub_all haystack needle repl =
  let nl = String.length needle in
  if nl = 0 then haystack
  else
    let rec go i acc =
      match
        (try Some (String.index_from haystack i needle.[0]) with _ -> None)
      with
      | None -> String.concat "" (List.rev (String.sub haystack i (String.length haystack - i) :: acc))
      | Some j ->
          if j + nl <= String.length haystack
             && String.sub haystack j nl = needle
          then go (j + nl) (repl :: String.sub haystack i (j - i) :: acc)
          else go (j + 1) (String.sub haystack i (j + 1 - i) :: acc)
    in
    go 0 []

let t1 key arg = sub_all (t key) "{1}" arg
