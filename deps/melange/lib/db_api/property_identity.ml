module Domain = Melange_db.Property_identity

let isLogseqPropertyNamespace namespace_ =
  Domain.is_logseq_property_namespace (Js.Nullable.toOption namespace_)

let isUserPropertyNamespace value = Domain.is_user_property_namespace value

let isPluginPropertyNamespace namespace_ =
  Domain.is_plugin_property_namespace (Js.Nullable.toOption namespace_)

let isInternalProperty namespace_ ident is_keyword =
  Domain.is_internal_property
    ~namespace_:(Js.Nullable.toOption namespace_)
    ~ident ~is_keyword

let isProperty namespace_ ident is_keyword =
  Domain.is_property
    ~namespace_:(Js.Nullable.toOption namespace_)
    ~ident ~is_keyword

let validPropertyName value = Domain.valid_property_name value

let builtInI18nKey namespace_ name =
  Domain.built_in_i18n_key ~namespace_:(Js.Nullable.toOption namespace_) ~name
  |> Js.Nullable.fromOption

let builtInHasRefValue ident = Domain.built_in_has_ref_value ident
