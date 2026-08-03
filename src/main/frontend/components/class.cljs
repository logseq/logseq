(ns frontend.components.class
  (:require [frontend.components.block :as block]
            [frontend.context.i18n :refer [t]]
            [frontend.db.model :as model]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [io.factorhouse.hsx.core :as hsx]))

(defn class-children-aux
  [class {:keys [default-collapsed?] :as opts}]
  (let [children (->> (:logseq.property.class/_extends class)
                      ;; Disallow parent cycles
                      (remove #(= (:db/id class) (:db/id %))))]
    (when (seq children)
      [:ul
       (for [child (sort-by :block/title children)]
         (let [title [:li.ml-2 (block/page-reference {:show-brackets? false
                                                      :show-unique-title? false} (:block/uuid child) nil)]]
           (if (seq (:logseq.property.class/_extends child))
             (ui/foldable
              title
              (class-children-aux child opts)
              {:default-collapsed? default-collapsed?})
             title)))])))

(hsx/defc class-children
  [class]
  (when (seq (:logseq.property.class/_extends class))
    (let [children-pages (set (model/get-structured-children (state/get-current-repo) (:db/id class)))
          ;; Expand children if there are about a pageful of total blocks to display
          default-collapsed? (> (count children-pages) 30)]
      (ui/foldable
       ;; Auto-section signpost: same quiet treatment as "Linked references"
       ;; and "All N" (see the auto-section header block in page.css) instead of
       ;; the old one-off font-medium/opacity-50. "Title · N" mirrors the
       ;; section-header idiom already used by CMD+K's result groups and the
       ;; icon picker (cmdk/core.cljs, icon.cljs section-header).
       [:div.ls-auto-section-title
        [:span (t :property/children)]
        [:span.ls-auto-section-sep "\u00b7"]
        [:span.ls-auto-section-count (count children-pages)]]
       [:div.ls-auto-section-list.mt-2 (class-children-aux class {:default-collapsed? default-collapsed?})]
       {:default-collapsed? false
        :title-trigger? true
        ;; Puts the label on the page spine and the chevron in the gutter.
        :class "ls-auto-section"}))))
