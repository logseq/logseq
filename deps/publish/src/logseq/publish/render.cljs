(ns logseq.publish.render
  (:require-macros [hiccups.core])
  (:require [clojure.string :as string]
            [hiccups.runtime]
            [logseq.common.util :as common-util]
            [logseq.db.frontend.property :as db-property]
            [logseq.db.frontend.property.type :as db-property-type]
            [logseq.graph-parser.mldoc :as gp-mldoc]
            [logseq.publish.common :as publish-common]
            [logseq.publish.model :as publish-model]))

(def ref-regex
  (js/RegExp. "\\[\\[([0-9a-fA-F-]{36})\\]\\]|\\(\\(([0-9a-fA-F-]{36})\\)\\)" "g"))

(defonce inline-config
  (gp-mldoc/default-config :markdown))

(defn inline-ast [text]
  (gp-mldoc/inline->edn text inline-config))

(defn content->nodes [content uuid->title graph-uuid]
  (let [s (or content "")
        re ref-regex]
    (set! (.-lastIndex re) 0)
    (loop [idx 0 out []]
      (let [m (.exec re s)]
        (if (nil? m)
          (cond-> out
            (< idx (count s)) (conj (subs s idx)))
          (let [start (.-index m)
                end (.-lastIndex re)
                uuid (or (aget m 1) (aget m 2))
                title (get uuid->title uuid uuid)
                href (when graph-uuid
                       (str "/page/" graph-uuid "/" uuid))
                node (if href
                       [:a.page-ref {:href href} title]
                       title)
                out (cond-> out
                      (< idx start) (conj (subs s idx start))
                      true (conj node))]
            (recur end out)))))))

(defn property-title
  [prop-key property-title-by-ident]
  (cond
    (string? prop-key) prop-key
    (keyword? prop-key) (or (get property-title-by-ident prop-key)
                            (name prop-key))
    :else (str prop-key)))

(defn property-value-empty?
  [value]
  (cond
    (nil? value) true
    (string? value) (string/blank? value)
    (coll? value) (empty? value)
    :else false))

(defn format-datetime
  [value]
  (let [date (cond
               (instance? js/Date value) value
               (number? value) (js/Date. value)
               (string? value) (js/Date. value)
               :else nil)]
    (when date
      (-> (.toISOString date)
          (string/replace "T" " ")
          (string/replace "Z" "")))))

(defn nodes-join
  [nodes-list sep]
  (reduce (fn [acc nodes]
            (if (empty? nodes)
              acc
              (if (seq acc)
                (into (conj acc sep) nodes)
                (into [] nodes))))
          []
          nodes-list))

(defn property-type
  [prop-key property-type-by-ident]
  (or (get property-type-by-ident prop-key)
      (get-in db-property/built-in-properties [prop-key :schema :type])))

(defn page-ref->uuid [name name->uuid]
  (or (get name->uuid name)
      (get name->uuid (common-util/page-name-sanity-lc name))))

(defn entity->link-node
  [entity ctx]
  (let [title (publish-model/entity->title entity)
        uuid (:block/uuid entity)
        graph-uuid (:graph-uuid ctx)]
    (if (and uuid graph-uuid (publish-model/page-entity? entity))
      [[:a.page-ref {:href (str "/page/" graph-uuid "/" uuid)} title]]
      [title])))

(defn property-value->nodes
  [value prop-key ctx entities]
  (let [prop-type (property-type prop-key (:property-type-by-ident ctx))
        ref-type? (contains? db-property-type/all-ref-property-types prop-type)]
    (cond
      (nil? value)
      []

      (string? value)
      (if (= prop-type :datetime)
        (if-let [formatted (format-datetime value)]
          [formatted]
          (content->nodes value (:uuid->title ctx) (:graph-uuid ctx)))
        (content->nodes value (:uuid->title ctx) (:graph-uuid ctx)))

      (keyword? value)
      [(name value)]

      (map? value)
      (if-let [eid (:db/id value)]
        (property-value->nodes eid prop-key ctx entities)
        (if-let [content (db-property/property-value-content value)]
          (property-value->nodes content prop-key ctx entities)
          [(pr-str value)]))

      (or (set? value) (sequential? value))
      (nodes-join (map #(property-value->nodes % prop-key ctx entities) value) ", ")

      (number? value)
      (cond
        (= prop-type :datetime)
        (if-let [formatted (format-datetime value)]
          [formatted]
          [(str value)])

        (and ref-type? (get entities value))
        (entity->link-node (get entities value) ctx)

        :else
        [(str value)])

      :else
      [(str value)])))

(defn built-in-tag?
  [entity]
  (when-let [ident (:db/ident entity)]
    (= "logseq.class" (namespace ident))))

(defn filter-tags
  [values entities]
  (let [values (if (sequential? values) values [values])]
    (->> values
         (remove (fn [value]
                   (cond
                     (keyword? value) (= "logseq.class" (namespace value))
                     :else
                     (let [entity (cond
                                    (map? value) value
                                    (number? value) (get entities value)
                                    :else nil)]
                       (and entity (built-in-tag? entity))))))
         vec)))

(defn entity-properties
  [entity ctx entities]
  (let [props (db-property/properties entity)
        inline-props (:block/properties entity)
        props (if (map? inline-props)
                (merge props inline-props)
                props)
        props (->> props
                   (remove (fn [[k _]]
                             (true? (get (:property-hidden-by-ident ctx) k))))
                   (map (fn [[k v]]
                          (if (= k :block/tags)
                            [k (filter-tags v entities)]
                            [k v])))
                   (remove (fn [[_ v]] (property-value-empty? v)))
                   (remove (fn [[k v]]
                             (and (= k :block/tags) (property-value-empty? v)))))
        props (into {} props)]
    props))

(defn render-properties
  [props ctx entities]
  (when (seq props)
    [:dl.properties
     (for [[k v] (sort-by (fn [[prop-key _]]
                            (string/lower-case
                             (property-title prop-key (:property-title-by-ident ctx))))
                          props)]
       [:div.property
        [:dt.property-name (property-title k (:property-title-by-ident ctx))]
        [:dd.property-value
         (into [:span] (property-value->nodes v k ctx entities))]])]))

(defn inline->nodes [ctx item]
  (let [[type data] item
        {:keys [uuid->title name->uuid graph-uuid]} ctx]
    (cond
      (or (= "Plain" type) (= "Spaces" type))
      (content->nodes data uuid->title graph-uuid)

      (= "Break_Line" type)
      [[:br]]

      (= "Emphasis" type)
      (let [[[kind] items] data
            tag (case kind
                  "Bold" :strong
                  "Italic" :em
                  "Underline" :ins
                  "Strike_through" :del
                  "Highlight" :mark
                  :span)
            children (mapcat #(inline->nodes ctx %) items)]
        [(into [tag] children)])

      (or (= "Verbatim" type) (= "Code" type))
      [[:code data]]

      (= "Link" type)
      (let [url (:url data)
            label (:label data)
            [link-type link-value] url
            label-nodes (cond
                          (vector? label) (mapcat #(inline->nodes ctx %) label)
                          (seq? label) (mapcat #(inline->nodes ctx %) label)
                          (string? label) (content->nodes label uuid->title graph-uuid)
                          :else [])
            page-uuid (when (= "Page_ref" link-type)
                        (or (page-ref->uuid link-value name->uuid)
                            (when (common-util/uuid-string? link-value) link-value)))
            page-title (when page-uuid
                         (get uuid->title page-uuid))
            label-nodes (cond
                          (seq label-nodes) label-nodes
                          page-title [page-title]
                          (string? link-value) [link-value]
                          :else [""])
            href (cond
                   page-uuid (str "/page/" graph-uuid "/" page-uuid)
                   (string? link-value) link-value
                   :else nil)]
        (if href
          [(into [:a.page-ref {:href href}] label-nodes)]
          label-nodes))

      (= "Tag" type)
      (let [s (or (second data) "")
            page-uuid (page-ref->uuid s name->uuid)]
        (if page-uuid
          [[:a.page-ref {:href (str "/page/" graph-uuid "/" page-uuid)} (str "#" s)]]
          [(str "#" s)]))

      :else
      (content->nodes (str data) uuid->title graph-uuid))))

(defn block-content-nodes [block ctx]
  (let [raw (or (:block/content block)
                (:block/title block)
                (:block/name block)
                "")
        format :markdown
        ctx (assoc ctx :format format)
        ast (inline-ast raw)
        content (if (seq ast)
                  (mapcat #(inline->nodes ctx %) ast)
                  (content->nodes raw (:uuid->title ctx) (:graph-uuid ctx)))]
    (into [:span.block-text] content)))

(defn block-raw-content [block]
  (or (:block/content block)
      (:block/title block)
      (:block/name block)
      ""))

(defn- asset-url [block ctx]
  (let [asset-type (:logseq.property.asset/type block)
        asset-uuid (:block/uuid block)
        external-url (:logseq.property.asset/external-url block)
        graph-uuid (:graph-uuid ctx)]
    (cond
      (string? external-url) external-url
      (and asset-uuid asset-type graph-uuid)
      (str "/asset/" graph-uuid "/" asset-uuid "." asset-type)
      :else nil)))

(defn- asset-node [block ctx]
  (let [asset-type (:logseq.property.asset/type block)
        asset-url (asset-url block ctx)
        title (or (:block/title block) (str asset-type))
        ext (string/lower-case (or asset-type ""))]
    (when asset-url
      (cond
        (contains? #{"png" "jpg" "jpeg" "gif" "webp" "svg" "bmp" "avif"} ext)
        [:img.asset-image {:src asset-url :alt title}]

        (contains? #{"mp4" "webm" "mov"} ext)
        [:video.asset-video {:src asset-url :controls true}]

        (contains? #{"mp3" "wav" "ogg"} ext)
        [:audio.asset-audio {:src asset-url :controls true}]

        :else
        [:a.asset-link {:href asset-url :target "_blank"} title]))))

(defn block-display-node [block ctx]
  (let [display-type (:logseq.property.node/display-type block)
        asset-node (when (:logseq.property.asset/type block)
                     (asset-node block ctx))]
    (case display-type
      :asset asset-node
      :code
      (let [lang (:logseq.property.code/lang block)
            attrs (cond-> {:class "code-block"}
                    (string? lang) (assoc :data-lang lang))]
        [:div attrs [:code (block-raw-content block)]])

      :math
      [:div.math-block (block-raw-content block)]

      :quote
      [:blockquote.quote-block (block-content-nodes block ctx)]

      (or asset-node
          (block-content-nodes block ctx)))))

(defn block-content-from-ref [ref ctx]
  (let [raw (or (get ref "source_block_content") "")
        ast (inline-ast raw)
        content (if (seq ast)
                  (mapcat #(inline->nodes ctx %) ast)
                  (content->nodes raw (:uuid->title ctx) (:graph-uuid ctx)))]
    (into [:span.block-text] content)))

(comment
  (def ^:private void-tags
    #{"area" "base" "br" "col" "embed" "hr" "img" "input" "link" "meta" "param" "source" "track" "wbr"}))

(defn render-hiccup [node]
  (hiccups.core/html node))

(defn sort-blocks [blocks]
  (sort-by (fn [block]
             (or (:block/order block) (:block/uuid block) ""))
           blocks))

(defn render-block-tree [children-by-parent parent-id ctx]
  (let [children (get children-by-parent parent-id)]
    (when (seq children)
      [:ul.blocks
       (map (fn [block]
              (let [child-id (:db/id block)
                    nested (render-block-tree children-by-parent child-id ctx)
                    has-children? (boolean nested)
                    properties (render-properties (entity-properties block ctx (:entities ctx))
                                                  ctx
                                                  (:entities ctx))]
                [:li.block
                 [:div.block-content
                  (block-display-node block ctx)
                  (when has-children?
                    [:button.block-toggle
                     {:type "button" :aria-expanded "true"}
                     "▾"])]
                 (when properties
                   [:div.block-properties properties])
                 (when nested
                   [:div.block-children nested])]))
            (sort-blocks children))])))

(defn linked-references
  [ctx graph-uuid linked-by-page]
  [:section.linked-refs
   [:h2 "Linked references"]
   (for [{:keys [page_uuid page_title blocks]} linked-by-page]
     (let [ref-page-uuid page_uuid
           ref-page-title page_title
           href (when (and graph-uuid ref-page-uuid)
                  (str "/page/" graph-uuid "/" ref-page-uuid))]
       [:div.ref-page
        (if href
          [:a.page-ref {:href href} ref-page-title]
          [:div.ref-title ref-page-title])
        (when (seq blocks)
          [:ul.ref-blocks
           (for [block blocks]
             [:li.ref-block [:div.block-content (block-content-from-ref block ctx)]])])]))])

(defn tag-item-val [item k]
  (cond
    (map? item) (or (get item k)
                    (get item (name k)))
    (object? item) (or (aget item (name k))
                       (aget item k))
    :else nil))

(defn format-timestamp
  [ts]
  (when (number? ts)
    (.toLocaleString (js/Date. ts))))

(defn render-tagged-item
  [graph-uuid item]
  (let [item-graph-uuid (tag-item-val item :graph_uuid)
        graph-uuid (or item-graph-uuid graph-uuid)
        source-page-uuid (tag-item-val item :source_page_uuid)
        source-page-title (tag-item-val item :source_page_title)
        source-block-uuid (tag-item-val item :source_block_uuid)
        source-block-content (tag-item-val item :source_block_content)
        updated-at (tag-item-val item :updated_at)
        page? (and source-page-uuid (= source-page-uuid source-block-uuid))
        href (when (and graph-uuid source-page-uuid)
               (str "/page/" graph-uuid "/" source-page-uuid))]
    [:li.tagged-item
     [:div.tagged-main
      (if href
        [:a.page-ref {:href href} (or source-page-title source-page-uuid)]
        [:span (or source-page-title source-page-uuid)])
      (when (and source-block-content (not page?))
        [:div.tagged-block source-block-content])
      [:div.tagged-sub
       (if page?
         (str "Page: " source-page-uuid)
         (str "Block: " source-block-uuid))]]
     [:span.tagged-meta (or (format-timestamp updated-at) "—")]]))

(defn render-page-html
  [transit page-uuid-str refs-data tagged-nodes]
  (let [payload (publish-common/read-transit-safe transit)
        meta (publish-common/get-publish-meta payload)
        graph-uuid (when meta
                     (or (:graph meta)
                         (:publish/graph meta)
                         (get meta "graph")
                         (get meta "publish/graph")))
        datoms (:datoms payload)
        entities (publish-model/datoms->entities datoms)
        page-uuid (uuid page-uuid-str)
        page-entity (some (fn [[_e entity]]
                            (when (= (:block/uuid entity) page-uuid)
                              entity))
                          entities)
        page-title (publish-model/entity->title page-entity)
        page-eid (some (fn [[e entity]]
                         (when (= (:block/uuid entity) page-uuid)
                           e))
                       entities)
        uuid->title (reduce (fn [acc [_e entity]]
                              (if-let [uuid-value (:block/uuid entity)]
                                (assoc acc (str uuid-value) (publish-model/entity->title entity))
                                acc))
                            {}
                            entities)
        name->uuid (reduce (fn [acc [_e entity]]
                             (if-let [uuid-value (:block/uuid entity)]
                               (let [uuid-str (str uuid-value)
                                     title (:block/title entity)]
                                 (assoc acc title uuid-str))
                               acc))
                           {}
                           entities)
        property-title-by-ident (reduce (fn [acc [_e entity]]
                                          (if-let [ident (:db/ident entity)]
                                            (assoc acc ident (publish-model/entity->title entity))
                                            acc))
                                        {}
                                        entities)
        property-type-by-ident (reduce (fn [acc [_e entity]]
                                         (if-let [ident (:db/ident entity)]
                                           (assoc acc ident (:logseq.property/type entity))
                                           acc))
                                       {}
                                       entities)
        property-hidden-by-ident (reduce (fn [acc [_e entity]]
                                           (if-let [ident (:db/ident entity)]
                                             (assoc acc ident (true? (:logseq.property/hide? entity)))
                                             acc))
                                         {}
                                         entities)
        children-by-parent (->> entities
                                (reduce (fn [acc [e entity]]
                                          (if (and (= (:block/page entity) page-eid)
                                                   (not= e page-eid)
                                                   (not (:logseq.property/created-from-property entity)))
                                            (let [parent (or (:block/parent entity) page-eid)]
                                              (update acc parent (fnil conj []) entity))
                                            acc))
                                        {})
                                (reduce-kv (fn [acc k v]
                                             (assoc acc k (sort-blocks v)))
                                           {}))
        ctx {:uuid->title uuid->title
             :name->uuid name->uuid
             :graph-uuid graph-uuid
             :property-title-by-ident property-title-by-ident
             :property-type-by-ident property-type-by-ident
             :property-hidden-by-ident property-hidden-by-ident
             :entities entities}
        page-properties (render-properties (entity-properties page-entity ctx entities)
                                           ctx
                                           entities)
        blocks (render-block-tree children-by-parent page-eid ctx)
        linked-by-page (when refs-data
                         (->> (get refs-data "refs")
                              (group-by #(get % "source_page_uuid"))
                              (map (fn [[_ items]]
                                     {:page_title (get (first items) "source_page_title")
                                      :page_uuid (get (first items) "source_page_uuid")
                                      :blocks items}))
                              (sort-by (fn [{:keys [page_title]}]
                                         (string/lower-case (or page_title ""))))))
        linked-refs (when (seq linked-by-page)
                      (linked-references ctx graph-uuid linked-by-page))
        tagged-section (when (seq tagged-nodes)
                         [:section.tagged-pages
                          [:h2 "Tagged nodes"]
                          [:ul.tagged-list
                           (for [item tagged-nodes]
                             (render-tagged-item graph-uuid item))]])
        doc [:html
             [:head
              [:meta {:charset "utf-8"}]
              [:meta {:name "viewport" :content "width=device-width,initial-scale=1"}]
              [:title page-title]
              [:link {:rel "stylesheet" :href "/static/publish.css"}]]
             [:body
              [:main.wrap
               [:div.page-toolbar
                (when graph-uuid
                  [:a.toolbar-btn {:href (str "/graph/" graph-uuid)} "Home"])
                [:button.toolbar-btn
                 {:type "button"
                  :onclick "window.toggleTopBlocks(this)"}
                 "Collapse all"]]

               [:h1 page-title]

               (when page-properties
                 [:section.page-properties page-properties])

               (when blocks blocks)
               (when tagged-section tagged-section)
               (when linked-refs linked-refs)]
              [:script {:type "module" :src "/static/publish.js"}]]]]
    (str "<!doctype html>" (render-hiccup doc))))

(defn render-graph-html
  [graph-uuid pages]
  (let [rows (->> pages
                  (map (fn [page]
                         (let [page-uuid (aget page "page_uuid")
                               page-title (aget page "page_title")
                               updated-at (aget page "updated_at")
                               href (str "/page/" graph-uuid "/" page-uuid)
                               short-id (aget page "short_id")]
                           {:page-uuid page-uuid
                            :page-title page-title
                            :href href
                            :short-id short-id
                            :updated-at updated-at})))
                  (sort-by (fn [row]
                             (or (:updated-at row) 0)))
                  reverse)
        doc [:html
             [:head
              [:meta {:charset "utf-8"}]
              [:meta {:name "viewport" :content "width=device-width,initial-scale=1"}]
              [:title (str "Published pages - " graph-uuid)]
              [:link {:rel "stylesheet" :href "/static/publish.css"}]]
             [:body
              [:main.wrap
               [:h1 "Published pages"]
               (if (seq rows)
                 [:ul.page-list
                  (for [{:keys [page-uuid page-title href updated-at short-id]} rows]
                    [:li.page-item
                     [:div.page-links
                      [:a.page-link {:href href} (or page-title page-uuid)]
                      (when short-id
                        [:a.short-link {:href (str "/s/" short-id)}
                         (str "/s/" short-id)])]
                     [:span.page-meta (or (format-timestamp updated-at) "—")]])]
                 [:p "No pages have been published yet."])]]]]
    (str "<!doctype html>" (render-hiccup doc))))

(defn render-tag-html
  [graph-uuid tag-uuid tag-title tag-items]
  (let [rows tag-items
        title (or tag-title tag-uuid)
        doc [:html
             [:head
              [:meta {:charset "utf-8"}]
              [:meta {:name "viewport" :content "width=device-width,initial-scale=1"}]
              [:title (str "Tag - " title)]
              [:link {:rel "stylesheet" :href "/static/publish.css"}]]
             [:body
              [:main.wrap
               [:h1 title]
               [:p.tag-sub (str "Tag: " tag-uuid)]
               [:p.graph-meta (str "Graph: " graph-uuid)]
               (if (seq rows)
                 [:ul.page-list
                  (for [item rows]
                    (render-tagged-item graph-uuid item))]
                 [:p "No published nodes use this tag yet."])]]]]
    (str "<!doctype html>" (render-hiccup doc))))

(defn render-tag-name-html
  [tag-name tag-title tag-items]
  (let [rows tag-items
        title (or tag-title tag-name)
        doc [:html
             [:head
              [:meta {:charset "utf-8"}]
              [:meta {:name "viewport" :content "width=device-width,initial-scale=1"}]
              [:title (str "Tag - " title)]
              [:link {:rel "stylesheet" :href "/static/publish.css"}]]
             [:body
              [:main.wrap
               [:h1 title]
               [:p.tag-sub (str "Tag: " tag-name)]
               (if (seq rows)
                 [:ul.page-list
                  (for [row rows
                        :let [graph-id (tag-item-val row :graph_uuid)
                              page-uuid (tag-item-val row :source_page_uuid)
                              page-title (tag-item-val row :source_page_title)
                              short-id (tag-item-val row :short_id)
                              href (when (and graph-id page-uuid)
                                     (str "/page/" graph-id "/" page-uuid))]]
                    [:li.page-item
                     [:div.page-links
                      (if href
                        [:a.page-ref {:href href} (or page-title page-uuid)]
                        [:span (or page-title page-uuid)])
                      (when short-id
                        [:a.short-link {:href (str "/s/" short-id)}
                         (str "/s/" short-id)])]
                     [:span.page-meta (or (format-timestamp (tag-item-val row :updated_at)) "—")]])]
                 [:p "No published pages use this tag yet."])]]]]
    (str "<!doctype html>" (render-hiccup doc))))

(defn render-ref-html
  [graph-uuid ref-name ref-title ref-items]
  (let [rows ref-items
        title (or ref-title ref-name)
        doc [:html
             [:head
              [:meta {:charset "utf-8"}]
              [:meta {:name "viewport" :content "width=device-width,initial-scale=1"}]
              [:title (str "Ref - " title)]
              [:link {:rel "stylesheet" :href "/static/publish.css"}]]
             [:body
              [:main.wrap
               [:h1 title]
               [:p.tag-sub (str "Reference: " ref-name)]
               (if (seq rows)
                 [:ul.page-list
                  (for [row rows
                        :let [graph-id (or (tag-item-val row :graph_uuid) graph-uuid)
                              page-uuid (tag-item-val row :source_page_uuid)
                              page-title (tag-item-val row :source_page_title)
                              short-id (tag-item-val row :short_id)
                              href (when (and graph-id page-uuid)
                                     (str "/page/" graph-id "/" page-uuid))]]
                    [:li.page-item
                     [:div.page-links
                      (if href
                        [:a.page-ref {:href href} (or page-title page-uuid)]
                        [:span (or page-title page-uuid)])
                      (when short-id
                        [:a.short-link {:href (str "/s/" short-id)}
                         (str "/s/" short-id)])]
                     [:span.page-meta (or (format-timestamp (tag-item-val row :updated_at)) "—")]])]
                 [:p "No published pages reference this yet."])]]]]
    (str "<!doctype html>" (render-hiccup doc))))

(defn render-not-published-html
  [graph-uuid]
  (let [title "Page not published"
        doc [:html
             [:head
              [:meta {:charset "utf-8"}]
              [:meta {:name "viewport" :content "width=device-width,initial-scale=1"}]
              [:title title]
              [:link {:rel "stylesheet" :href "/static/publish.css"}]]
             [:body
              [:main.wrap
               [:div.page-toolbar
                (when graph-uuid
                  [:a.toolbar-btn {:href (str "/graph/" graph-uuid)} "Home"])]
               [:h1 title]
               [:p.tag-sub "This page hasn't been published yet."]]]]]
    (str "<!doctype html>" (render-hiccup doc))))

(defn render-password-html
  [graph-uuid page-uuid wrong?]
  (let [title "Protected page"
        doc [:html
             [:head
              [:meta {:charset "utf-8"}]
              [:meta {:name "viewport" :content "width=device-width,initial-scale=1"}]
              [:title title]
              [:link {:rel "stylesheet" :href "/static/publish.css"}]]
             [:body
              [:main.wrap
               [:div.page-toolbar
                (when graph-uuid
                  [:a.toolbar-btn {:href (str "/graph/" graph-uuid)} "Home"])]
               [:div.password-card
                [:h1 title]
                [:p.tag-sub "This page is password protected."]
                (when wrong?
                  [:p.password-error "Incorrect password."])
                [:form.password-form {:method "GET"}
                 (when page-uuid
                   [:input {:type "hidden" :name "page" :value page-uuid}])
                 [:label.password-label {:for "publish-password"} "Enter password"]
                 [:input.password-input {:id "publish-password"
                                         :name "password"
                                         :type "password"
                                         :placeholder "Password"
                                         :required true}]
                 [:button.toolbar-btn {:type "submit"} "Unlock"]]]]]]]
    (str "<!doctype html>" (render-hiccup doc))))

(defn render-404-html
  []
  (let [title "Page not found"
        doc [:html
             [:head
              [:meta {:charset "utf-8"}]
              [:meta {:name "viewport" :content "width=device-width,initial-scale=1"}]
              [:title title]
              [:link {:rel "stylesheet" :href "/static/publish.css"}]]
             [:body
              [:main.wrap
               [:div.not-found
                [:p.not-found-eyebrow "404"]
                [:h1 title]
                [:p.tag-sub "We couldn't find that page. It may have been removed or never published."]]]]]]
    (str "<!doctype html>" (render-hiccup doc))))
