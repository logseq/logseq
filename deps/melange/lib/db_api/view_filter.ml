module Domain = Melange_db.View_filter

let textContains values pattern =
  Domain.text_contains (Rrbvec.of_array values) pattern

let textNotContains values pattern =
  Domain.text_not_contains (Rrbvec.of_array values) pattern

let number_operator = function
  | "gt" -> Domain.Gt
  | "gte" -> Gte
  | "lt" -> Lt
  | "lte" -> Lte
  | operator ->
      invalid_arg ("DB view filter: unknown number operator " ^ operator)

let numberMatch operator values target =
  Domain.number_match (number_operator operator) (Rrbvec.of_array values) target

let between values start end_ =
  Domain.between (Rrbvec.of_array values)
    ~start:(Js.Nullable.toOption start)
    ~end_:(Js.Nullable.toOption end_)

let booleanMatch negated value expected =
  Domain.boolean_match ~negated ~value ~expected

let emptyMatch negated empty = Domain.empty_match ~negated ~empty

let membershipMatch negated match_empty hit =
  Domain.membership_match ~negated ~match_empty ~hit

let timestampMatch before value target =
  Domain.timestamp_match ~before
    ~value:(Js.Nullable.toOption value)
    ~target:(Js.Nullable.toOption target)

let combine or_ results = Domain.combine ~or_ (Rrbvec.of_array results)
