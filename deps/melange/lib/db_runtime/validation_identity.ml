module Domain = Melange_db.Validation_identity

let isUserPropertyIdent namespace_ qualified =
  Domain.is_user_property_ident
    ~namespace_:(Js.Nullable.toOption namespace_)
    ~qualified

let isClassIdent namespace_ qualified =
  Domain.is_class_ident ~namespace_:(Js.Nullable.toOption namespace_) ~qualified

let isInternalIdent namespace_ ident =
  Domain.is_internal_ident ~namespace_:(Js.Nullable.toOption namespace_) ~ident
