(ns frontend.components.icon.core
  "Shared icon-picker module state (tabler index, section collapse states,
   grid geometry) plus the core renderers: the `icon` element fn, the
   node-icon resolution pair used across the app, and the recently-used
   item storage."
  (:require [camel-snake-kebab.core :as csk]
            [cljs-bean.core :as bean]
            [clojure.string :as string]
            [frontend.colors :as colors]
            [frontend.components.icon.normalization :as norm]
            [frontend.storage :as storage]
            [frontend.ui :as ui]
            [logseq.db :as ldb]))

(def icon-grid-cols 9)

(defonce *tabler-icons (atom nil))
(defn get-tabler-icons
  []
  (if @*tabler-icons
    @*tabler-icons
    (let [result (->> (keys (bean/->clj js/tablerIcons))
                      ;; @tabler/icons-react exports icon components (IconFoo) alongside
                      ;; utility functions (e.g. createReactComponent). Drop anything that
                      ;; isn't an icon component — otherwise they surface as phantom entries
                      ;; in search, render empty, and corrupt the icon property when picked.
                      (filter #(string/starts-with? (name %) "Icon"))
                      (map (fn [k]
                             (-> (string/replace (csk/->Camel_Snake_Case (name k)) "_" " ")
                                 (string/replace-first "Icon " ""))))
                      ;; csk/->Camel_Snake_Case treats "AB" in IconAB / IconAB2 / IconABOff
                      ;; as an acronym and lowercases the B, producing labels "Ab" / "Ab 2"
                      ;; / "Ab Off". The renderer's reverse lookup (label → tabler key)
                      ;; then expects "IconAb" and misses the real "IconAB" export — so
                      ;; the icon renders empty. Filter them out so they don't surface
                      ;; as broken entries in search. Other consecutive-cap exports
                      ;; (IconEPassport, IconSTurnDown) survive because the second cap
                      ;; is followed by lowercase letters, which preserves the boundary.
                      (remove #{"Ab" "Ab 2" "Ab Off"}))]
      (reset! *tabler-icons result)
      result)))

(defonce *section-states (atom {}))

(defn icon
  [icon' & [opts]]
  (let [icon' (if (keyword? icon') (name icon') icon')
        normalized (or (norm/normalize-icon icon') icon')
        color? (:color? opts)
        opts (dissoc opts :color?)
        item (cond
               ;; Unified shape format
               (and (map? normalized) (= :emoji (:type normalized)) (get-in normalized [:data :value]))
               [:span.ui__icon
                [:em-emoji (merge {:id (get-in normalized [:data :value])
                                   :style {:line-height 1}}
                                  opts)]]

               (and (map? normalized) (= :icon (:type normalized)) (get-in normalized [:data :value]))
               (ui/icon (get-in normalized [:data :value]) opts)

               ;; Legacy format support (fallback if normalization failed)
               (and (map? icon') (= :emoji (:type icon')) (:id icon'))
               [:span.ui__icon
                [:em-emoji (merge {:id (:id icon')
                                   :style {:line-height 1}}
                                  opts)]]

               (and (map? icon') (= :tabler-icon (:type icon')) (:id icon'))
               (ui/icon (:id icon') (cond-> opts
                                      (#{"property" "child-node" "page-property" "node"} (:id icon'))
                                      (assoc :extension? true)))

               :else nil)]
    (when item
      (if color?
        (let [c (or (get-in normalized [:data :color])
                    (some-> icon' :color))
              ;; Display-color: when a real hex is stored, lift contrast vs the
              ;; current page background to WCAG 3:1 (non-text UI threshold).
              ;; CSS-var values (Radix `var(--rx-...)`) are theme-aware
              ;; out-of-band and intentionally bypassed.
              page-bg (when (and c (string/starts-with? c "#"))
                        (colors/read-bg-var "--ls-primary-background-color"))
              display-c (if (and c (not= c "inherit")
                                 (string/starts-with? c "#")
                                 page-bg)
                          (colors/adjust-for-contrast c page-bg 3.0)
                          c)]
          [:span.inline-flex.items-center.ls-icon-color-wrap
           {:class (when (and c (not= c "inherit")) "icon-colored")
            :style {:color (or display-c "inherit")}} item])
        item))))

(defn get-node-icon
  [node-entity {:keys [ignore-current-icon?]
                :or {ignore-current-icon? false}}]
  (or (when-not ignore-current-icon?
        (get node-entity :logseq.property/icon))
      (let [asset-type (:logseq.property.asset/type node-entity)
            first-tag-icon (some :logseq.property/icon (sort-by :db/id (:block/tags node-entity)))]
        (cond
          (ldb/class? node-entity)
          "hash"
          (ldb/property? node-entity)
          "letter-p"
          (ldb/page? node-entity)
          "file"
          (= asset-type "pdf")
          "book"
          (some? first-tag-icon)
          first-tag-icon
          :else
          "point-filled"))))

(defn get-node-icon-cp
  [node-entity opts]
  (let [opts' (merge {:size 14} opts)
        node-icon (if (:link? opts)
                    "arrow-narrow-right"
                    (get-node-icon node-entity opts))]
    (when-not (or (string/blank? node-icon) (and (contains? #{"point-filled" "letter-p" "hash" "file"} node-icon) (:not-text-or-page? opts)))
      [:div.icon-cp-container.flex.items-center
       (merge {:style {:color (or (:color node-icon) "inherit")}}
              (select-keys opts [:class]))
       (icon node-icon (dissoc opts' :not-text-or-page? :link?))])))

(defn get-used-items
  []
  (let [v2-items (storage/get :ui/ls-icons-used-v2)
        items (if (seq v2-items)
                v2-items
                ;; Migrate from legacy format
                (let [legacy-items (storage/get :ui/ls-icons-used)]
                  (if (seq legacy-items)
                    (let [normalized (map norm/normalize-icon legacy-items)]
                      (storage/set :ui/ls-icons-used-v2 normalized)
                      normalized)
                    [])))]
    ;; Drop entries that no longer resolve (e.g. residue from the phantom
    ;; tabler-icons-react utility exports that used to appear in search).
    (filter norm/renderable-icon? items)))

(defn add-used-item!
  [m]
  (let [normalized (norm/normalize-icon m)
        ;; Filter dupes across the WHOLE existing list, not just the first 24
        ;; — otherwise an existing duplicate beyond position 24 stays in storage
        ;; on the next call. Then cons the new pick and cap at 24.
        s (some->> (or (get-used-items) [])
                   (remove #(= normalized %))
                   (cons normalized)
                   (take 24))]
    (storage/set :ui/ls-icons-used-v2 s)))
