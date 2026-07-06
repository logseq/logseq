(ns frontend.util.email
  (:require [clojure.string :as string]))

(defn mask-email
  [email]
  (when (some? email)
    (let [email (str email)]
      (if (string/blank? email)
        email
        (let [email-chars (vec email)
              visible-indexes (->> email-chars
                                   (keep-indexed (fn [idx ch]
                                                   (when-not (contains? #{\@ \.} ch)
                                                     idx)))
                                   ((juxt first last))
                                   (remove nil?)
                                   set)]
          (->> email-chars
               (map-indexed
                (fn [idx ch]
                  (cond
                    (contains? #{\@ \.} ch) ch
                    (contains? visible-indexes idx) ch
                    :else \*)))
               (apply str)))))))

(defn mask-email?
  [config]
  (not (false? (:ui/mask-email? config))))

(defn display-email
  [email config]
  (if (mask-email? config)
    (mask-email email)
    email))
