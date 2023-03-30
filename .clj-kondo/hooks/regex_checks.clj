(ns hooks.regex-checks
  "This hook try to find out those error-prone double escaping regex expressions"
  (:require [clj-kondo.hooks-api :as api]))

(def double-escaped-checker #"\(re-pattern .*\\\\\\\\[\?\#\|\.\^\$\\\+].*\)")

(defn double-escaped-regex
  [{:keys [node]}]
  (let [[_ _content regex & _args] (:children node)
        regex-string (str (api/sexpr regex))]
    (when (and (= (api/tag regex) :regex)
               (re-matches double-escaped-checker regex-string))
     (api/reg-finding! (assoc (meta regex)
                             :message (str "double slash (\\\\) found in this regular expression followed by a regex special character (, + , * , ? , ^ , $ , | , \\ ), have you mistakenly double escaped a special character? Only escaping one-time is required. No escape is required in character class []. (use #_{:clj-kondo/ignore [:regex-checks/double-escaped-regex]} to ignore)")
                             :type :regex-checks/double-escaped-regex)))))
