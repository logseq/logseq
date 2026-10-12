val or_ : Env.t -> string -> string -> Playwright.locator
val or_list : Env.t -> string list -> Playwright.locator
val and_ : Env.t -> string -> string -> Playwright.locator
val and_l : Playwright.locator -> Playwright.locator -> Playwright.locator
val filter :
  Env.t ->
  ?has:'a ->
  ?has_not:'b ->
  ?has_text:'c -> ?has_not_text:'d -> string -> Playwright.locator
