(ns ^:bb-compatible frontend.schema.handler.plugin-config)

(def Plugins-edn
  [:map-of
   [:and
    ;; Use qualified and call name on it as :keyword sometimes generated an incompatible
    ;; suffix e.g. :/.
    {:gen/schema :qualified-keyword
     :gen/fmap '(fn [x] (keyword (str "id-" (name x))))}
    :keyword]
   ; The plugin keys should not be changed between releases without a migration plan
   ; for existing config files
   [:map
    [:name
     [:and {:gen/fmap '(partial str "Name ")}
      string?]]
    [:version
     [:and
      {:gen/fmap '(fn [_] (apply str (interpose "." (repeatedly 3 (fn [] (rand-int 10))))))}
      string?]]
    [:repo
     [:and {:gen/fmap '(partial str "github-user/")}
      string?]]
    [:theme boolean?]]])
