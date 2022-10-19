(ns ^:bb-compatible frontend.schema.handler.plugin-config
  "Malli schemas for plugin-config")

; The plugin keys should not be changed between releases without a migration plan
; for existing config files
(def Plugin
  ":repo and :version determine the correct plugin to install. :theme and
  :effect are needed for the install process to work correctly"
  [:map
   [:version
    [:and
     {:gen/fmap '(fn [_] (apply str (interpose "." (repeatedly 3 (fn [] (rand-int 10))))))}
     string?]]
   [:repo
    [:and {:gen/fmap '(partial str "github-user/")}
     string?]]
   [:effect boolean?]
   [:theme boolean?]])

(def Plugins-edn
  [:map-of
   [:and
    ;; Use qualified and call name on it as :keyword sometimes generated an incompatible
    ;; suffix e.g. :/.
    {:gen/schema :qualified-keyword
     :gen/fmap '(fn [x] (keyword (str "id-" (name x))))}
    :keyword]
   Plugin])
