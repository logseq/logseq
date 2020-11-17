(ns frontend.format.export.org
  (:require [cljs.core.match :refer-macros [match]]
            [frontend.util :refer [format] :as util]
            [clojure.string :as string]
            [frontend.format.protocol :as protocol]
            [frontend.format.mldoc :as mldoc]))

(declare inlines)
(defn inline
  [config t]
  (match t
    ["Plain" s]
    s

    ["Spaces" s]
    s

    ["Subscript" l]
    (format "_{%s}" (inlines t))

    ["Superscript" l]
    (format "^{%s}" (inlines t))

    ["Tag" s]
    (str "#" s)

    ["Emphasis" [[kind] data]]
    (let [s (case kind
              "Bold" "*"
              "Italic" "/"
              "Underline" "_"
              "Strike_through" "+"
              "Highlight" "^^")]
      (format "%s%s%s" s (inlines data) s))

    ["Entity" e]
    (format "\\%s" (:name e))

    ["Latex_Fragment" ["Displayed" s]]
    (format "$$%s$$" (util/escape-chars s [\$]))

    ["Latex_Fragment" ["Inline" s]]
    (format "$%s$" (util/escape-chars s [\$]))

    ["Target" s]
    (format "<<%s>>" s)

    ["Radio_Target" s]
    (format "<<<%s>>>" s)

    ["Email" address]
    (let [{:keys [local_part domain]} address
          address (str local_part "@" domain)]
      (format "<%s>" address))

    ["Block_reference" id]
    (format "((%s))" id)

    ["Nested_link" link]

    ["Link" link]

    ["Verbatim" s]
    (format "=%s=" (util/escape-chars code ["="]))

    ["Code" s]
    (format "~%s~" (util/escape-chars code ["~"]))

    ["Inline_Source_Block" x]
    (let [{:keys [language options code]} x]
      (format "src_[%s]%s{%s}"
              language
              options
              (util/escape-chars code ["}"])))

    ["Export_Snippet" backend s]
    (format "@%s{%s}" backend
            (util/escape-chars s ["{" "}"]))

    ["Inline_Hiccup" s]
    s

    ["Break_Line"]
    "\n"

    ["Hard_Break_Line"]
    "\n"

    ["Timestamp" ["Scheduled" t]]
    (format "SCHEDULED: %s" (mldoc/timestamp->str t))

    ["Timestamp" ["Deadline" t]]
    (format "DEADLINE: %s" (mldoc/timestamp->str t))

    ["Timestamp" ["Date" t]]
    (mldoc/timestamp->str t)

    ["Timestamp" ["Closed" t]]
    (format "CLOSED: %s" (mldoc/timestamp->str t))

    ["Timestamp" ["Range" t]]
    (mldoc/range->str t)

    ["Timestamp" ["Clock" ["Stopped" t]]]
    (format "CLOCK: %s\n" (mldoc/range->str t))

    ["Timestamp" ["Clock" ["Started" t]]]
    (format "CLOCK: %s\n" (mldoc/timestamp->str t))

    ["Cookie" ["Percent" n]]
    (format "[%d%%]" n)

    ["Cookie" ["Absolute" current total]]
    (format "[%d/%d]" current total)

    ["Footnote_Reference" options]
    (let [{:keys [name definition]} options]
      (if (seq definition)
        (format "[fn:%s:%s]" name (inlines definition))
        (format "[fn:%s]" name)))

    ["Macro" options]
    (let [{:keys [name args]} options
          escape-fn #(util/escape-chars % ["{" "}"])]
      (format "{{{%s(%s)}}}"
              (escape-fn name)
              (->> (map escape-fn args)
                   (string/join ", "))))

    :else
    ;; TODO: Add sentry error report
    ""))

(defn inlines
  [config col]
  (->> (map #(inline config %) col)
       (string/join "")))

(declare blocks)

;; TODO
(defn block
  [config t]
  (match t
    ["Properties" m]

    ["Paragraph" l]

    ["Horizontal_Rule"]

    ["Heading" h]

    ["List" l]

    ["Table" t]

    ["Math" s]

    ["Example" l]

    ["Src" options]

    ["Quote" l]

    ["Raw_Html" content]

    ["Hiccup" content]

    ["Export" backend options content]

    ["Custom" block-type options result content]

    ["Latex_Fragment" l]

    ["Latex_Environment" name option content]

    ["Displayed_Math" content]

    ["Footnote_Definition" name definition]

    ;; TODO: Add sentry error report
    :else
    ""
    ))

(defn blocks
  [config col]
  (->> (map #(block config %) col)
       (string/join "\n")))

(defrecord Org []
  protocol/export
  (export [this config page-ast]
    (blocks config page-ast)))
