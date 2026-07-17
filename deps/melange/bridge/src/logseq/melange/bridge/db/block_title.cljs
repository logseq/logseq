(ns logseq.melange.bridge.db.block-title
  "DataScript block-title representation boundary."
  (:require ["@logseq/melange-js-api/db" :as melange-db]
            [logseq.melange.bridge.platform.datascript :as d]
            [logseq.melange.bridge.runtime :as runtime]))

(def ^:private block-title-api (.-BlockTitle melange-db))

(defn block-unique-title
  "Returns a display title that disambiguates duplicate class titles and appends tags."
  [db block {:keys [with-tags? alias truncate? title]
             :or {with-tags? true
                  truncate? true}}]
  ((.-uniqueTitleWith block-title-api)
   (runtime/runtime-adapter)
   (d/adapter)
   db
   block
   #js {:withTags (boolean with-tags?)
        :alias alias
        :truncate (boolean truncate?)
        :title title}))
