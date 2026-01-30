(ns logseq.publish.render
  "Renders published content as HTML"
  (:require-macros [hiccups.core])
  (:require [clojure.string :as string]
            [hiccups.runtime]
            [logseq.common.util :as common-util]
            [logseq.db.frontend.property :as db-property]
            [logseq.db.frontend.property.type :as db-property-type]
            [logseq.graph-parser.mldoc :as gp-mldoc]
            [logseq.publish.common :as publish-common]
            [logseq.publish.model :as publish-model]))

;; Timestamp in milliseconds used for cache busting static assets.
(defonce version 1767194868810)

(def ref-regex
  (js/RegExp. "\\[\\[([0-9a-fA-F-]{36})\\]\\]|\\(\\(([0-9a-fA-F-]{36})\\)\\)" "g"))

(defonce inline-config
  (gp-mldoc/default-config :markdown))

(defn- block-ast
  [text]
  (when-not (string/blank? text)
    (->> (gp-mldoc/->edn text inline-config)
         (map first))))

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

(defn- normalize-nodes
  [nodes]
  (cond
    (nil? nodes) []
    (and (vector? nodes) (keyword? (first nodes))) [nodes]
    :else nodes))

(defn- icon-span
  [icon]
  (when (and (map? icon) (string? (:id icon)) (not (string/blank? (:id icon))))
    [:span
     (cond->
      {:class "property-icon"
       :data-icon-id (:id icon)
       :data-icon-type (name (:type icon))}
       (:color icon)
       (assoc :style (str "color: " (:color icon) ";")))]))

(defn- with-icon
  [icon nodes]
  (let [icon-node (icon-span icon)]
    (if icon-node
      (into [:span {:class "property-value-with-icon"} icon-node] nodes)
      nodes)))

(defn- page-title-node
  [title icon]
  (let [icon-node (icon-span icon)]
    (if icon-node
      [:h1 [:span {:class "property-value-with-icon"} icon-node title]]
      [:h1 title])))

(defn- theme-toggle-node
  []
  [:button.theme-toggle
   {:type "button"
    :role "switch"
    :aria-checked "false"}
   [:span.theme-toggle__icon.theme-toggle__icon--day {:aria-hidden "true"}]
   [:span.theme-toggle__thumb {:aria-hidden "true"}]
   [:span.theme-toggle__icon.theme-toggle__icon--night {:aria-hidden "true"}]])

(defn- toolbar-node
  [& nodes]
  (into [:div.page-toolbar] nodes))

(defn- search-node
  [graph-uuid]
  (let [graph-id (some-> graph-uuid str)]
    [:div.publish-search {:data-graph-uuid graph-id}
     [:button.publish-search-toggle
      {:type "button"
       :aria-label "Search"
       :aria-expanded "false"}
      [:span.ti.ti-search {:aria-hidden "true"}]]
     [:input.publish-search-input
      (cond->
       {:id "publish-search-input"
        :type "search"
        :placeholder "Search graph (Cmd+K)"
        :autocomplete "off"
        :spellcheck "false"
        :aria-label "Search graph"}
        (string/blank? (or graph-id ""))
        (assoc :disabled true :placeholder "Search unavailable"))]
     [:div.publish-search-hint "Up/Down to navigate"]
     [:div.publish-search-results
      {:id "publish-search-results"
       :hidden true}]]))

(defn- theme-init-script
  []
  [:script
   "(function(){try{var k='publish-theme';var t=localStorage.getItem(k);if(!t){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.setAttribute('data-theme',t);}catch(e){}})();"])

(defn- publish-script
  []
  [:script {:type "module" :src (str "/static/publish.js?v=" version)}])

(defn- icon-runtime-script
  []
  [:script
   "(function(){if(window.React&&window.React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED){return;}var s='http://www.w3.org/2000/svg';var k=function(n){return n.replace(/[A-Z]/g,function(m){return'-'+m.toLowerCase();});};var a=function(el,key,val){if(key==='className'){el.setAttribute('class',val);return;}if(key==='style'&&val&&typeof val==='object'){for(var sk in val){el.style[sk]=val[sk];}return;}if(key==='ref'||key==='key'||key==='children'){return;}if(val===true){el.setAttribute(key,'');return;}if(val===false||val==null){return;}var attr=key;if(key==='strokeWidth'){attr='stroke-width';}else if(key==='strokeLinecap'){attr='stroke-linecap';}else if(key==='strokeLinejoin'){attr='stroke-linejoin';}else if(key!=='viewBox'&&/[A-Z]/.test(key)){attr=k(key);}el.setAttribute(attr,val);};var c=function(el,child){if(child==null||child===false){return;}if(Array.isArray(child)){child.forEach(function(n){c(el,n);});return;}if(typeof child==='string'||typeof child==='number'){el.appendChild(document.createTextNode(child));return;}if(child.nodeType){el.appendChild(child);} };var e=function(type,props){var children=Array.prototype.slice.call(arguments,2);if(type===Symbol.for('react.fragment')){var frag=document.createDocumentFragment();children.forEach(function(n){c(frag,n);});return frag;}if(typeof type==='function'){return type(Object.assign({},props,{children:children}));}var isSvg=type==='svg'||(props&&props.xmlns===s);var el=isSvg?document.createElementNS(s,type):document.createElement(type);if(props){for(var p in props){a(el,p,props[p]);}}children.forEach(function(n){c(el,n);});return el;};window.React={createElement:e,forwardRef:function(fn){return fn;},Fragment:Symbol.for('react.fragment'),__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED:{ReactCurrentOwner:{current:null}}};window.PropTypes=new Proxy({}, {get:function(){return function(){return null;};}});})();"])

(defn- head-node
  [title {:keys [description keywords topics tags url custom-css-hash graph-uuid]}]
  (let [description (when (string? description)
                      (string/trim description))
        keywords (->> [keywords topics tags]
                      (map #(when (string? %) (string/trim %)))
                      (remove string/blank?)
                      (string/join ", "))
        meta-tags (remove nil?
                          [[:meta {:name "description" :content description}]
                           (when (seq keywords)
                             [:meta {:name "keywords" :content keywords}])
                           (when (string? tags)
                             [:meta {:name "tags" :content tags}])
                           (when (string? topics)
                             [:meta {:name "topics" :content topics}])
                           [:meta {:content "summary_large_image" :name "twitter:card"}]
                           (when description
                             [:meta {:content description :name "twitter:description"}])
                           [:meta {:content "@logseq" :name "twitter:site"}]
                           [:meta {:content title :name "twitter:title"}]
                           [:meta {:content "https://asset.logseq.com/static/img/social-banner-230118.png"
                                   :name "twitter:image:src"}]
                           (when description
                             [:meta {:content description :name "twitter:image:alt"}])
                           [:meta {:content title :property "og:title"}]
                           [:meta {:content "article" :property "og:type"}]
                           (when url
                             [:meta {:content url :property "og:url"}])
                           [:meta {:content "https://asset.logseq.com/static/img/social-banner-230118.png"
                                   :property "og:image"}]
                           (when description
                             [:meta {:content description :property "og:description"}])
                           [:meta {:content "logseq" :property "og:site_name"}]])
        custom-css (when (and (string? custom-css-hash) (string? graph-uuid))
                     [:link {:rel "stylesheet"
                             :href (str "/asset/" graph-uuid "/publish.css?v=" custom-css-hash)}])]
    [:head
     [:meta {:charset "UTF-8"}]
     [:meta {:name "viewport"
             :content "width=device-width, initial-scale=1.0, maximum-scale=5.0, minimum-scale=1.0"}]
     [:meta {:http-equiv "X-UA-Compatible" :content "ie=edge"}]
     [:title title]
     [:link {:href "https://asset.logseq.com/static/img/logo.png"
             :rel "shortcut icon"
             :type "image/png"}]
     [:link {:href "https://asset.logseq.com/static/img/logo.png"
             :rel "shortcut icon"
             :sizes "192x192"}]
     [:link {:href "https://asset.logseq.com/static/img/logo.png"
             :rel "apple-touch-icon"}]
     [:meta {:content "Logseq" :name "apple-mobile-web-app-title"}]
     [:meta {:content "yes" :name "apple-mobile-web-app-capable"}]
     [:meta {:content "yes" :name "apple-touch-fullscreen"}]
     [:meta {:content "black-translucent" :name "apple-mobile-web-app-status-bar-style"}]
     [:meta {:content "yes" :name "mobile-web-app-capable"}]
     (theme-init-script)
     (icon-runtime-script)
     [:script {:defer true :src "/static/tabler.ext.js"}]
     [:link {:rel "stylesheet"
             :href "https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.0/dist/tabler-icons.min.css"}]
     [:link {:rel "stylesheet" :href (str "/static/tabler-extension.css?v=" version)}]
     [:link {:rel "stylesheet" :href (str "/static/publish.css?v=" version)}]
     custom-css
     meta-tags]))

(defn- render-head
  ([title] (render-head title nil))
  ([title opts]
   (head-node title (or opts {}))))

(defn- meta-value
  [meta k]
  (or (get meta k)
      (get meta (name k))))

(defn property-type
  [prop-key property-type-by-ident]
  (or (get property-type-by-ident prop-key)
      (get-in db-property/built-in-properties [prop-key :schema :type])))

(defn page-ref->uuid [name name->uuid]
  (or (get name->uuid name)
      (get name->uuid (common-util/page-name-sanity-lc name))))

(defn- entity->link-node
  [entity ctx prop-key]
  (let [title (publish-model/entity->title entity)
        uuid (:block/uuid entity)
        graph-uuid (:graph-uuid ctx)]
    (cond
      (and uuid graph-uuid (publish-model/page-entity? entity))
      [[:a.page-ref {:href (str "/page/" graph-uuid "/" uuid)}
        (str (when (= prop-key :block/tags) "#") title)]]
      (common-util/url? title)
      [[:a {:href title} title]]
      :else
      [title])))

(defn property-value->nodes
  [value prop-key ctx entities]
  (let [prop-type (property-type prop-key (:property-type-by-ident ctx))
        ref-type? (contains? db-property-type/all-ref-property-types prop-type)]
    (cond
      (nil? value)
      []

      (string? value)
      (cond
        (= prop-type :datetime)
        (if-let [formatted (format-datetime value)]
          [formatted]
          (content->nodes value (:uuid->title ctx) (:graph-uuid ctx)))

        :else
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
        (let [entity (get entities value)]
          (with-icon (:logseq.property/icon entity)
            (entity->link-node entity ctx prop-key)))

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
         (into [:span] (normalize-nodes (property-value->nodes v k ctx entities)))]])]))

(defn- property-ui-position
  [prop-key ctx]
  (when-let [property (get (:property-entity-by-ident ctx) prop-key)]
    (:logseq.property/ui-position property)))

(defn- split-properties-by-position
  [props ctx]
  (reduce (fn [acc [k v]]
            (let [position (property-ui-position k ctx)
                  bucket (case position
                           (:block-left :block-right :block-below) position
                           :properties)]
              (update acc bucket assoc k v)))
          {:properties {}
           :block-left {}
           :block-right {}
           :block-below {}}
          props))

(defn- sorted-properties
  [props ctx]
  (sort-by (fn [[prop-key _]]
             (get-in ctx [:property-entity-by-ident prop-key :block/order]))
           props))

(defn- class-has?
  [class-name target]
  (some #{target} (string/split (or class-name "") #"\s+")))

(defn- node-has-class?
  [node target]
  (when (and (vector? node) (keyword? (first node)))
    (let [attrs (second node)]
      (and (map? attrs) (class-has? (:class attrs) target)))))

(defn- strip-positioned-value
  [node]
  (if (node-has-class? node "property-value-with-icon")
    (let [[tag attrs & children] node
          icon-children (filter #(node-has-class? % "property-icon") children)]
      (if (seq icon-children)
        (into [tag attrs] icon-children)
        node))
    node))

(defn- positioned-value-nodes
  [value prop-key ctx entities]
  (cond
    (= prop-key :logseq.property/icon)
    (let [icon-node (icon-span value)]
      (if icon-node [icon-node] []))

    (= prop-key :block/tags)
    (normalize-nodes (property-value->nodes value prop-key ctx entities))

    :else
    (->> (property-value->nodes value prop-key ctx entities)
         normalize-nodes
         (map strip-positioned-value))))

(defn- render-positioned-properties
  [props ctx entities position]
  (when (seq props)
    (case position
      :block-below
      [:div.positioned-properties.block-below
       (for [[k v] (sorted-properties props ctx)]
         [:div.positioned-property
          [:span.property-name (property-title k (:property-title-by-ident ctx))]
          [:span.property-value
           (into [:span] (positioned-value-nodes v k ctx entities))]])]

      [:div {:class (str "positioned-properties " (name position))}
       (for [[k v] (sorted-properties props ctx)]
         [:span.positioned-property
          (into [:span] (positioned-value-nodes v k ctx entities))])])))

(def ^:private youtube-regex #"^((?:https?:)?//)?((?:www|m).)?((?:youtube.com|youtu.be|y2u.be|youtube-nocookie.com))(/(?:[\w-]+\?v=|embed/|v/)?)([\w-]+)([\S^\?]+)?$")
(def ^:private vimeo-regex #"^((?:https?:)?//)?((?:www).)?((?:player.vimeo.com|vimeo.com))(/(?:video/)?)([\w-]+)(\S+)?$")
(def ^:private bilibili-regex #"^((?:https?:)?//)?((?:www).)?((?:bilibili.com))(/(?:video/)?)([\w-]+)(\?p=(\d+))?(\S+)?$")
(def ^:private loom-regex #"^((?:https?:)?//)?((?:www).)?((?:loom.com))(/(?:share/|embed/))([\w-]+)(\S+)?$")

(defn- safe-match
  [re value]
  (when (and (string? value) (not (string/blank? value)))
    (re-find re value)))

(defn- macro-iframe
  [src {:keys [class title]}]
  (when (and (string? src) (not (string/blank? src)))
    (let [class-name (string/join " " (remove nil? ["macro-embed" class]))]
      [:div {:class class-name}
       [:iframe {:src src
                 :title (or title "Embedded content")
                 :loading "lazy"
                 :allow "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                 :allowfullscreen true}]])))

(defn- youtube-embed
  [url]
  (let [id (cond
             (and (string? url) (= 11 (count url))) url
             :else (nth (safe-match youtube-regex url) 5 nil))]
    (when (and id (string? id))
      (macro-iframe (str "https://www.youtube.com/embed/" id) {:class "macro-embed--video" :title "YouTube"}))))

(defn- vimeo-embed
  [url]
  (let [id (nth (safe-match vimeo-regex url) 5 nil)]
    (when (and id (string? id))
      (macro-iframe (str "https://player.vimeo.com/video/" id) {:class "macro-embed--video" :title "Vimeo"}))))

(defn- bilibili-embed
  [url]
  (let [id (if (<= (count (or url "")) 15)
             url
             (nth (safe-match bilibili-regex url) 5 nil))]
    (when (and id (string? id) (not (string/blank? id)))
      (macro-iframe (str "https://player.bilibili.com/player.html?bvid=" id "&high_quality=1&autoplay=0")
                    {:class "macro-embed--video" :title "Bilibili"}))))

(defn- video-embed
  [url]
  (when (common-util/url? url)
    (let [matches (or (safe-match youtube-regex url)
                      (safe-match loom-regex url)
                      (safe-match vimeo-regex url)
                      (safe-match bilibili-regex url))
          src (cond
                (and matches (contains? #{"youtube.com" "youtu.be" "y2u.be" "youtube-nocookie.com"} (nth matches 3)))
                (let [id (nth matches 5)]
                  (when (= 11 (count (or id "")))
                    (str "https://www.youtube.com/embed/" id)))

                (and matches (string/ends-with? (nth matches 3) "loom.com"))
                (str "https://www.loom.com/embed/" (nth matches 5))

                (and matches (string/ends-with? (nth matches 3) "vimeo.com"))
                (str "https://player.vimeo.com/video/" (nth matches 5))

                (and matches (= (nth matches 3) "bilibili.com"))
                (str "https://player.bilibili.com/player.html?bvid=" (nth matches 5) "&high_quality=1&autoplay=0")

                :else
                url)]
      (macro-iframe src {:class "macro-embed--video" :title "Video"}))))

(defn- tweet-embed
  [url]
  (let [url (cond
              (and (string? url) (<= (count url) 15)) (str "https://x.com/i/status/" url)
              :else url)]
    (when url
      [:div.twitter-tweet
       [:a {:href url} url]])))

(defn- tweet-embed-from-html
  [html]
  (let [id (last (safe-match #"/status/(\d+)" html))]
    (when (and id (string? id))
      (tweet-embed id))))

(defn- macro->nodes
  [ctx {:keys [name arguments]}]
  (let [name (string/lower-case (or name ""))
        arguments (if (sequential? arguments) arguments [])
        first-arg (first arguments)]
    (cond
      (= name "cloze")
      [[:span.cloze (string/join ", " arguments)]]

      (= name "youtube")
      (when-let [node (youtube-embed first-arg)] [node])

      (= name "vimeo")
      (when-let [node (vimeo-embed first-arg)] [node])

      (= name "bilibili")
      (when-let [node (bilibili-embed first-arg)] [node])

      (= name "video")
      (when-let [node (video-embed first-arg)] [node])

      (contains? #{"tweet" "twitter"} name)
      (when-let [node (tweet-embed first-arg)] [node])

      :else
      (content->nodes (str "{{" name (when (seq arguments)
                                       (str " " (string/join ", " arguments))) "}}")
                      (:uuid->title ctx)
                      (:graph-uuid ctx)))))

(defn- parse-macro-text
  [value]
  (when-let [[_ name args] (and (string? value)
                                (re-find #"\{\{\s*([^\s\}]+)\s*([^}]*)\}\}" value))]
    (let [args (->> (string/split (or args "") #",")
                    (map string/trim)
                    (remove string/blank?)
                    vec)]
      {:name name
       :arguments args})))

(defn- normalize-macro-data
  [data]
  (cond
    (map? data) data
    (string? data) (parse-macro-text data)
    (and (sequential? data) (seq data))
    (let [name (first data)
          args (second data)]
      {:name (when (string? name) name)
       :arguments (if (sequential? args) args [])})
    :else nil))

(defn- macro-embed-node?
  [node]
  (when (vector? node)
    (let [tag (first node)
          attrs (second node)]
      (and (= tag :div)
           (map? attrs)
           (string? (:class attrs))
           (string/includes? (:class attrs) "macro-embed")))))

(defn inline->nodes [ctx item]
  (let [[type data] item
        {:keys [uuid->title name->uuid graph-uuid]} ctx]
    (cond
      (or (= "Plain" type) (= "Spaces" type))
      (let [sub-ast (inline-ast data)
            simple-plain? (and (= 1 (count sub-ast))
                               (= "Plain" (ffirst sub-ast)))]
        (if (and (seq sub-ast) (not simple-plain?))
          (mapcat #(inline->nodes ctx %) sub-ast)
          (content->nodes data uuid->title graph-uuid)))

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
                   (= "Complex" link-type) (when (and (map? link-value)
                                                      (string? (:protocol link-value))
                                                      (string? (:link link-value)))
                                             (str (:protocol link-value) "://" (:link link-value)))
                   (string? link-value) link-value
                   :else nil)]
        (if href
          [(into [:a {:class (when page-uuid "page-ref")
                      :href href}] label-nodes)]
          label-nodes))

      (= "Tag" type)
      (let [s (or (second data) "")
            page-uuid (page-ref->uuid s name->uuid)]
        (if page-uuid
          [[:a.page-ref {:href (str "/page/" graph-uuid "/" page-uuid)} (str "#" s)]]
          (if (and graph-uuid (not (string/blank? s)))
            [[:a.page-ref {:href (str "/tag/" (js/encodeURIComponent s))} (str "#" s)]]
            [(str "#" s)])))

      (= "Macro" type)
      (if-let [macro-data (normalize-macro-data data)]
        (or (macro->nodes ctx macro-data) [])
        (content->nodes (str data) uuid->title graph-uuid))

      (= "Email" type)
      (let [email (str (:local_part data) "@" (:domain data))]
        [[:a {:href (str "mailto:" email)} email]])

      (or (= "Inline_Html" type) (= "Export_Snippet" type))
      (if-let [node (tweet-embed-from-html data)]
        [node]
        [])

      :else
      (content->nodes (str data) uuid->title graph-uuid))))

(defn- inline-coll->nodes
  [ctx inline-coll]
  (mapcat #(inline->nodes ctx %) (or inline-coll [])))

(declare block-ast->nodes)
(defn- block-ast-coll->nodes
  [ctx content]
  (mapcat #(block-ast->nodes ctx %) (or content [])))

(defn- list-items->node
  [ctx items]
  (into
   [:ul]
   (map (fn [item]
          (let [content (let [content (:content item)]
                          (if (and (sequential? content)
                                   (every? #(and (vector? %) (string? (first %))) content))
                            (block-ast-coll->nodes ctx content)
                            (inline-coll->nodes ctx content)))
                nested (when (seq (:items item))
                         [(list-items->node ctx (:items item))])
                children (concat content nested)]
            (into [:li] children)))
        items)))

(defn- block-ast->nodes
  [ctx block-ast']
  (let [[type data] block-ast']
    (case type
      "Paragraph"
      (let [children (inline-coll->nodes ctx data)]
        (when (seq children)
          [(into [:p] children)]))

      "Heading"
      (let [children (inline-coll->nodes ctx (:title data))]
        (when (seq children)
          [(into [:p] children)]))

      "List"
      (when (seq data)
        [(list-items->node ctx data)])

      "Quote"
      (when (seq data)
        [(into [:blockquote] (mapcat #(block-ast->nodes ctx %) data))])

      "Example"
      (when (seq data)
        [[:pre (string/join "\n" data)]])

      "Src"
      (let [lines (:lines data)
            code (if (sequential? lines) (string/join "\n" lines) (str lines))]
        [[:pre [:code code]]])

      "Paragraph_Sep"
      [[:br]]

      "Horizontal_Rule"
      [[:hr]]

      (let [fallback (content->nodes (str data) (:uuid->title ctx) (:graph-uuid ctx))]
        (when (seq fallback)
          [(into [:p] fallback)])))))

(defn- block-ast-complex?
  [block-asts]
  (let [block-asts (seq block-asts)]
    (and block-asts
         (or (> (count block-asts) 1)
             (some (fn [[type _]]
                     (not (contains? #{"Paragraph" "Heading"} type)))
                   block-asts)))))

(defn- heading-level
  [block depth]
  (let [legacy (:block/heading-level block)
        prop (:logseq.property/heading block)
        legacy (when (and (number? legacy) (<= 1 legacy 6)) legacy)
        prop (cond
               (and (number? prop) (<= 1 prop 6)) prop
               (true? prop) (min (inc depth) 6)
               :else nil)]
    (or legacy prop)))

(defn- strip-heading-prefix
  [s]
  (string/replace s #"^\s*#+\s+" ""))

(defn- property-value->text
  [value ctx entities]
  (cond
    (nil? value) nil
    (string? value) value
    (keyword? value) (name value)
    (number? value)
    (if-let [entity (get entities value)]
      (publish-model/entity->title entity)
      (str value))
    (map? value)
    (if (:db/id value)
      (publish-model/entity->title value)
      (if-let [content (db-property/property-value-content value)]
        (str content)
        (str value)))
    (sequential? value)
    (->> value
         (map #(property-value->text % ctx entities))
         (remove string/blank?)
         distinct
         (string/join ", "))
    :else (str value)))

(defn block-content-nodes [block ctx depth]
  (let [raw (or (:block/content block)
                (:block/title block)
                (:block/name block)
                "")
        heading (heading-level block depth)
        raw (if heading
              (strip-heading-prefix raw)
              raw)
        block-asts (when-not heading (block-ast raw))
        block-level? (and (not heading) (block-ast-complex? block-asts))
        content (if block-level?
                  (mapcat #(block-ast->nodes ctx %) block-asts)
                  (let [ast (inline-ast raw)]
                    (if (seq ast)
                      (mapcat #(inline->nodes ctx %) ast)
                      (content->nodes raw (:uuid->title ctx) (:graph-uuid ctx)))))
        container (cond
                    heading (keyword (str "h" heading ".block-text.block-heading"))
                    block-level? :div.block-text
                    (some macro-embed-node? content) :div.block-text
                    :else :span.block-text)]
    (into [container] content)))

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

(def ^:private publish-image-variant-sizes
  [1024 1600])

(def ^:private publish-image-variant-types
  #{"png" "jpg" "jpeg" "webp"})

(def ^:private publish-image-sizes-attr
  "(max-width: 640px) 92vw, (max-width: 1024px) 88vw, 920px")

(defn- asset-variant-url
  [graph-uuid asset-uuid asset-type variant]
  (str "/asset/" graph-uuid "/" asset-uuid "@" variant "." asset-type))

(defn- variant-width
  [block size]
  (let [asset-width (:logseq.property.asset/width block)
        asset-height (:logseq.property.asset/height block)]
    (if (and (number? asset-width)
             (number? asset-height)
             (pos? asset-width)
             (pos? asset-height))
      (let [max-dim (max asset-width asset-height)
            scale (min 1 (/ size max-dim))]
        (js/Math.round (* asset-width scale)))
      size)))

(defn- asset-node [block ctx]
  (let [asset-type (:logseq.property.asset/type block)
        asset-url' (asset-url block ctx)
        external-url (:logseq.property.asset/external-url block)
        title (or (:block/title block) (str asset-type))
        ext (string/lower-case (or asset-type ""))
        graph-uuid (:graph-uuid ctx)
        asset-uuid (:block/uuid block)
        variant? (and (not (string? external-url))
                      graph-uuid
                      asset-uuid
                      (contains? publish-image-variant-types ext))
        srcset (when variant?
                 (->> publish-image-variant-sizes
                      (map (fn [size]
                             (let [width (variant-width block size)]
                               (str (asset-variant-url graph-uuid asset-uuid asset-type size)
                                    " "
                                    width
                                    "w"))))
                      (string/join ", ")))]
    (when asset-url'
      (cond
        (contains? #{"png" "jpg" "jpeg" "gif" "webp" "svg" "bmp" "avif"} ext)
        [:img.asset-image (cond-> {:src asset-url' :alt title}
                            srcset (assoc :srcset srcset :sizes publish-image-sizes-attr))]

        (contains? #{"mp4" "webm" "mov"} ext)
        [:video.asset-video {:src asset-url' :controls true}]

        (contains? #{"mp3" "wav" "ogg"} ext)
        [:audio.asset-audio {:src asset-url' :controls true}]

        :else
        [:a.asset-link {:href asset-url' :target "_blank"} title]))))

(defn block-display-node [block ctx depth]
  (let [display-type (:logseq.property.node/display-type block)
        asset-node' (when (:logseq.property.asset/type block)
                     (asset-node block ctx))]
    (case display-type
      :asset asset-node'
      :code
      (let [lang (:logseq.property.code/lang block)
            attrs (cond-> {:class "code-block"}
                    (string? lang) (assoc :data-lang lang))]
        [:div attrs [:code (block-raw-content block)]])

      :math
      [:div.math-block (block-raw-content block)]

      :quote
      [:blockquote.quote-block (block-content-nodes block ctx depth)]

      (or asset-node'
          (block-content-nodes block ctx depth)))))

(defn block-content-from-ref [ref ctx]
  (let [raw (or (get ref "source_block_content") "")
        block-asts (block-ast raw)
        block-level? (block-ast-complex? block-asts)
        content (if block-level?
                  (mapcat #(block-ast->nodes ctx %) block-asts)
                  (let [ast (inline-ast raw)]
                    (if (seq ast)
                      (mapcat #(inline->nodes ctx %) ast)
                      (content->nodes raw (:uuid->title ctx) (:graph-uuid ctx)))))]
    (into [(if block-level? :div.block-text :span.block-text)] content)))

(comment
  (def ^:private void-tags
    #{"area" "base" "br" "col" "embed" "hr" "img" "input" "link" "meta" "param" "source" "track" "wbr"}))

(defn render-hiccup [node]
  (hiccups.core/html node))

(defn sort-blocks [blocks]
  (sort-by (fn [block]
             (or (:block/order block) (:block/uuid block) ""))
           blocks))

(defn- linked-block-entity
  [block ctx visited]
  (let [link (:block/link block)
        linked-id (cond
                    (map? link) (:db/id link)
                    (number? link) link
                    :else nil)]
    (when (and linked-id (not (contains? visited linked-id)))
      (get (:entities ctx) linked-id))))

(defn render-block-tree
  ([page-children-by-parent linked-children-by-parent parent-id ctx]
   (render-block-tree page-children-by-parent linked-children-by-parent parent-id ctx #{} 1))
  ([page-children-by-parent linked-children-by-parent parent-id ctx visited depth]
   (let [children (get page-children-by-parent parent-id)]
     (when (seq children)
       [:ul.blocks
        (map (fn [block]
               (let [linked-block (linked-block-entity block ctx visited)
                     display-block (or linked-block block)
                     display-id (:db/id display-block)
                     visited (cond-> visited linked-block (conj display-id))
                     nested (render-block-tree
                             (if linked-block linked-children-by-parent page-children-by-parent)
                             linked-children-by-parent
                             display-id
                             ctx
                             visited
                             (inc depth))
                     has-children? (boolean nested)
                     collapsed? (:block/collapsed? display-block)
                     raw-props (entity-properties display-block ctx (:entities ctx))
                     icon-prop (get raw-props :logseq.property/icon)
                     tags-prop (get raw-props :block/tags)
                     raw-props (dissoc raw-props :logseq.property/icon :block/tags)
                     {:keys [properties block-left block-right block-below]}
                     (split-properties-by-position raw-props ctx)
                     block-left (cond-> block-left
                                  (and icon-prop (not (property-value-empty? icon-prop)))
                                  (assoc :logseq.property/icon icon-prop))
                     block-right (cond-> block-right
                                   (and tags-prop (not (property-value-empty? tags-prop)))
                                   (assoc :block/tags tags-prop))
                     positioned-left (render-positioned-properties block-left ctx (:entities ctx) :block-left)
                     positioned-right (render-positioned-properties block-right ctx (:entities ctx) :block-right)
                     positioned-below (render-positioned-properties block-below ctx (:entities ctx) :block-below)
                     properties (render-properties properties ctx (:entities ctx))
                     block-uuid (:block/uuid display-block)
                     block-uuid-str (some-> block-uuid str)]
                 [:li
                  (cond-> {:data-block-uuid block-uuid-str
                           :class (if collapsed? "block is-collapsed" "block")}
                    block-uuid-str (assoc :id (str "block-" block-uuid-str)))
                  [:div.block-content
                   (when positioned-left positioned-left)
                   (block-display-node display-block ctx depth)
                   (when positioned-right positioned-right)
                   (when has-children?
                     [:button.block-toggle
                      {:type "button"
                       :aria-expanded (str (not collapsed?))}
                      "▾"])]
                  (when positioned-below positioned-below)
                  (when properties
                    [:div.block-properties properties])
                  (when nested
                    [:div.block-children nested])]))
             (sort-blocks children))]))))

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
        [:div.tagged-block source-block-content])]
     [:span.tagged-meta (or (format-timestamp updated-at) "—")]]))

(defn- author-usernames
  [entities page-eid page-entity]
  (let [author-ids (->> entities
                        (keep (fn [[_e entity]]
                                (when (= (:block/page entity) page-eid)
                                  (publish-model/ref-eid (:logseq.property/created-by-ref entity)))))
                        (concat [(publish-model/ref-eid (:logseq.property/created-by-ref page-entity))])
                        (remove nil?)
                        distinct)]
    (->> author-ids
         (map #(get entities %))
         (keep publish-model/entity->title)
         (remove string/blank?)
         distinct
         sort)))

(defn ^:large-vars/cleanup-todo render-page-html
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
        page-updated-at (:block/updated-at page-entity)
        page-eid (some (fn [[e entity]]
                         (when (= (:block/uuid entity) page-uuid)
                           e))
                       entities)
        authors (author-usernames entities page-eid page-entity)
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
        property-entity-by-ident (reduce (fn [acc [_e entity]]
                                           (if-let [ident (:db/ident entity)]
                                             (assoc acc ident entity)
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
        linked-children-by-parent (->> entities
                                       (reduce (fn [acc [_e entity]]
                                                 (if (and (:block/parent entity)
                                                          (not (:logseq.property/created-from-property entity)))
                                                   (update acc (:block/parent entity) (fnil conj []) entity)
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
             :property-entity-by-ident property-entity-by-ident
             :entities entities}
        page-props (entity-properties page-entity ctx entities)
        page-properties (render-properties (dissoc page-props
                                                   :logseq.property/icon
                                                   :logseq.property.publish/published-url)
                                           ctx
                                           entities)
        blocks (render-block-tree children-by-parent linked-children-by-parent page-eid ctx)
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
        description (property-value->text (get page-props :logseq.property/description) ctx entities)
        tags (property-value->text (or (get page-props :block/tags)
                                       (get page-props :logseq.property/page-tags))
                                   ctx
                                   entities)
        keywords (property-value->text (get page-props :logseq.property/keywords) ctx entities)
        topics (property-value->text (get page-props :logseq.property/topics) ctx entities)
        page-url (when (and graph-uuid page-uuid-str)
                   (str "/page/" graph-uuid "/" page-uuid-str))
        custom-css-hash (meta-value meta :custom_publish_css_hash)
        custom-js-hash (meta-value meta :custom_publish_js_hash)
        doc [:html
             (render-head page-title {:description description
                                      :keywords keywords
                                      :topics topics
                                      :tags tags
                                      :url page-url
                                      :custom-css-hash custom-css-hash
                                      :graph-uuid graph-uuid})
             [:body
              [:main.wrap
               (toolbar-node
                (when graph-uuid
                  [:a.toolbar-btn {:href (str "/graph/" graph-uuid)} "Home"])
                (search-node graph-uuid)
                (theme-toggle-node))

               (page-title-node page-title (:logseq.property/icon page-entity))
               [:div.page-meta
                (when true
                  [:div.page-authors (str "By: " (string/join ", " authors))])

                (let [updated-at (format-timestamp page-updated-at)]
                  [:div.page-updated-at updated-at])]

               (when page-properties
                 [:section.page-properties
                  page-properties])

               (when blocks blocks)
               (when tagged-section tagged-section)
               (when linked-refs linked-refs)]
              (publish-script)
              (when (and (string? custom-js-hash) (string? graph-uuid))
                [:script {:defer true
                          :src (str "/asset/" graph-uuid "/publish.js?v=" custom-js-hash)}])]]]
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
             (render-head "Published pages")
             [:body
              [:main.wrap
               (toolbar-node
                (search-node graph-uuid)
                (theme-toggle-node))
               [:h1 "Published pages"]
               (if (seq rows)
                 [:ul.page-list
                  (for [{:keys [page-uuid page-title href updated-at]} rows]
                    [:li.page-item
                     [:div.page-links
                      [:a.page-link {:href href} (or page-title page-uuid)]]
                     [:span.page-meta (or (format-timestamp updated-at) "—")]])]
                 [:p "No pages have been published yet."])
               (publish-script)]]]]
    (str "<!doctype html>" (render-hiccup doc))))

(defn render-user-html
  [username user pages]
  (let [username (or (aget user "username") username)
        rows (->> pages
                  (map (fn [page]
                         (let [page-uuid (aget page "page_uuid")
                               page-title (aget page "page_title")
                               updated-at (aget page "updated_at")
                               graph-uuid (aget page "graph_uuid")
                               href (str "/page/" graph-uuid "/" page-uuid)
                               short-id (aget page "short_id")]
                           {:page-uuid page-uuid
                            :page-title page-title
                            :href href
                            :short-id short-id
                            :updated-at updated-at
                            :graph-uuid graph-uuid})))
                  (sort-by (fn [row]
                             (or (:updated-at row) 0)))
                  reverse)
        title (str "Published by " username)
        doc [:html
             (render-head title)
             [:body
              [:main.wrap
               (toolbar-node
                (search-node nil)
                (theme-toggle-node))
               [:h1 title]
               (if (seq rows)
                 [:ul.page-list
                  (for [{:keys [page-uuid page-title href updated-at]} rows]
                    [:li.page-item
                     [:div.page-links
                      [:a.page-link {:href href} (or page-title page-uuid)]]
                     [:span.page-meta
                      (or (format-timestamp updated-at) "—")]])]
                 [:p "No pages have been published yet."])
               (publish-script)]]]]
    (str "<!doctype html>" (render-hiccup doc))))

(defn render-tag-html
  [graph-uuid tag-uuid tag-title tag-items]
  (let [rows tag-items
        title (or tag-title tag-uuid)
        doc [:html
             (render-head (str "#" title))
             [:body
              [:main.wrap
               (toolbar-node
                (when graph-uuid
                  [:a.toolbar-btn {:href (str "/graph/" graph-uuid)} "Home"])
                (search-node graph-uuid)
                (theme-toggle-node))
               [:h1 (str "#" title)]
               (if (seq rows)
                 [:ul.page-list
                  (for [item rows]
                    (render-tagged-item graph-uuid item))]
                 [:p "No published nodes use this tag yet."])
               (publish-script)]]]]
    (str "<!doctype html>" (render-hiccup doc))))

(defn render-tag-name-html
  [tag-name tag-title tag-items]
  (let [rows tag-items
        title (or tag-title tag-name)
        doc [:html
             (render-head (str "Tag - " title))
             [:body
              [:main.wrap
               (toolbar-node
                [:a.toolbar-btn {:href "/"} "Home"]
                (theme-toggle-node))
               [:h1 (str "#" title)]
               (if (seq rows)
                 [:ul.page-list
                  (for [row rows]
                    (render-tagged-item (tag-item-val row :graph_uuid) row))]
                 [:p "No published pages use this tag yet."])
               (publish-script)]]]]
    (str "<!doctype html>" (render-hiccup doc))))

(defn render-home-html
  []
  (let [doc [:html
             (render-head "Logseq Publish")
             [:body.publish-home
              [:svg#publish-home-bg.publish-home-bg
               {:aria-hidden "true"}]
              [:main.publish-home-card
               [:div.publish-home-logo "Logseq Publish"]
               [:h1.publish-home-title
                "Small notes,"
                [:br]
                [:strong "big "]
                "connections!"]
               [:p.publish-home-subtitle
                "Publish your Logseq notes to the web. Each note links through "
                [:code "#tag"]
                " or "
                [:code "[[page]] references"]
                ", connecting your dots with others."]]
              [:script
               "(function(){\n"
               "  const svg = document.getElementById('publish-home-bg');\n"
               "  if (!svg) return;\n"
               "  let width = window.innerWidth;\n"
               "  let height = window.innerHeight;\n"
               "  const POINTS_COUNT = 40;\n"
               "  const MAX_DIST = 160;\n"
               "  const pts = [];\n"
               "  let circlesGroup;\n"
               "  let linesGroup;\n"
               "\n"
               "  const cssVar = (name) =>\n"
               "    getComputedStyle(document.documentElement)\n"
               "      .getPropertyValue(name)\n"
               "      .trim();\n"
               "\n"
               "  function resize() {\n"
               "    width = window.innerWidth;\n"
               "    height = window.innerHeight;\n"
               "    svg.setAttribute('width', width);\n"
               "    svg.setAttribute('height', height);\n"
               "    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);\n"
               "  }\n"
               "\n"
               "  function createSvgElement(tag, attrs) {\n"
               "    const el = document.createElementNS('http://www.w3.org/2000/svg', tag);\n"
               "    for (const k in attrs) el.setAttribute(k, attrs[k]);\n"
               "    return el;\n"
               "  }\n"
               "\n"
               "  function init() {\n"
               "    resize();\n"
               "    svg.innerHTML = '';\n"
               "\n"
               "    const lineColor = cssVar('--muted') || '#6f6e69';\n"
               "    const dotColor = cssVar('--ink') || '#282726';\n"
               "\n"
               "    linesGroup = createSvgElement('g', {\n"
               "      stroke: lineColor,\n"
               "      'stroke-width': 0.6,\n"
               "      'stroke-linecap': 'round',\n"
               "      opacity: 0.35\n"
               "    });\n"
               "    circlesGroup = createSvgElement('g', { fill: dotColor, opacity: 0.65 });\n"
               "\n"
               "    svg.appendChild(linesGroup);\n"
               "    svg.appendChild(circlesGroup);\n"
               "    pts.length = 0;\n"
               "\n"
               "    for (let i = 0; i < POINTS_COUNT; i++) {\n"
               "      const x = Math.random() * width;\n"
               "      const y = Math.random() * height;\n"
               "      const speed = 0.15 + Math.random() * 0.25;\n"
               "      const angle = Math.random() * Math.PI * 2;\n"
               "      const vx = Math.cos(angle) * speed;\n"
               "      const vy = Math.sin(angle) * speed;\n"
               "\n"
               "      const circle = createSvgElement('circle', {\n"
               "        cx: x,\n"
               "        cy: y,\n"
               "        r: 2 + Math.random() * 1.2\n"
               "      });\n"
               "\n"
               "      circlesGroup.appendChild(circle);\n"
               "      pts.push({ x, y, vx, vy, circle });\n"
               "    }\n"
               "  }\n"
               "\n"
               "  function step() {\n"
               "    linesGroup.innerHTML = '';\n"
               "\n"
               "    for (let i = 0; i < pts.length; i++) {\n"
               "      const p = pts[i];\n"
               "      p.x += p.vx;\n"
               "      p.y += p.vy;\n"
               "\n"
               "      if (p.x < 0 || p.x > width) p.vx *= -1;\n"
               "      if (p.y < 0 || p.y > height) p.vy *= -1;\n"
               "\n"
               "      p.circle.setAttribute('cx', p.x);\n"
               "      p.circle.setAttribute('cy', p.y);\n"
               "    }\n"
               "\n"
               "    for (let i = 0; i < pts.length; i++) {\n"
               "      for (let j = i + 1; j < pts.length; j++) {\n"
               "        const p1 = pts[i];\n"
               "        const p2 = pts[j];\n"
               "        const dx = p1.x - p2.x;\n"
               "        const dy = p1.y - p2.y;\n"
               "        const dist = Math.sqrt(dx * dx + dy * dy);\n"
               "        if (dist < MAX_DIST) {\n"
               "          const opacity = 0.35 * (1 - dist / MAX_DIST);\n"
               "          const line = createSvgElement('line', {\n"
               "            x1: p1.x,\n"
               "            y1: p1.y,\n"
               "            x2: p2.x,\n"
               "            y2: p2.y,\n"
               "            opacity: opacity.toString()\n"
               "          });\n"
               "          linesGroup.appendChild(line);\n"
               "        }\n"
               "      }\n"
               "    }\n"
               "\n"
               "    requestAnimationFrame(step);\n"
               "  }\n"
               "\n"
               "  window.addEventListener('resize', () => {\n"
               "    init();\n"
               "  });\n"
               "\n"
               "  init();\n"
               "  requestAnimationFrame(step);\n"
               "})();\n"]]]]
    (str "<!doctype html>" (render-hiccup doc))))

(defn render-ref-html
  [graph-uuid ref-name ref-title ref-items]
  (let [rows ref-items
        title (or ref-title ref-name)
        doc [:html
             (render-head (str "Ref - " title))
             [:body
              [:main.wrap
               (toolbar-node
                [:a.toolbar-btn {:href "/"} "Home"]
                (theme-toggle-node))
               [:h1 title]
               [:p.tag-sub (str "Reference: " ref-name)]
               (if (seq rows)
                 [:ul.page-list
                  (for [row rows
                        :let [graph-id (or (tag-item-val row :graph_uuid) graph-uuid)
                              page-uuid (tag-item-val row :source_page_uuid)
                              page-title (tag-item-val row :source_page_title)
                              href (when (and graph-id page-uuid)
                                     (str "/page/" graph-id "/" page-uuid))]]
                    [:li.page-item
                     [:div.page-links
                      (if href
                        [:a.page-ref {:href href} (or page-title page-uuid)]
                        [:span (or page-title page-uuid)])]
                     [:span.page-meta (or (format-timestamp (tag-item-val row :updated_at)) "—")]])]
                 [:p "No published pages reference this yet."])
               (publish-script)]]]]
    (str "<!doctype html>" (render-hiccup doc))))

(defn render-not-published-html
  [graph-uuid]
  (let [title "Page not published"
        doc [:html
             (render-head title)
             [:body
              [:main.wrap
               (toolbar-node
                (when graph-uuid
                  [:a.toolbar-btn {:href (str "/graph/" graph-uuid)} "Home"])
                (search-node graph-uuid)
                (theme-toggle-node))
               [:h1 title]
               [:p.tag-sub "This page hasn't been published yet."]
               (publish-script)]]]]
    (str "<!doctype html>" (render-hiccup doc))))

(defn render-password-html
  [graph-uuid page-uuid wrong?]
  (let [title "Protected page"
        doc [:html
             (render-head title)
             [:body
              [:main.wrap
               (toolbar-node
                (when graph-uuid
                  [:a.toolbar-btn {:href (str "/graph/" graph-uuid)} "Home"])
                (search-node graph-uuid)
                (theme-toggle-node))
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
                 [:button.toolbar-btn {:type "submit"} "Unlock"]]]
               (publish-script)]]]]
    (str "<!doctype html>" (render-hiccup doc))))

(defn render-404-html
  []
  (let [title "Page not found"
        doc [:html
             (render-head title)
             [:body
              [:main.wrap
               (toolbar-node
                [:a.toolbar-btn {:href "/"} "Home"]
                (theme-toggle-node))
               [:div.not-found
                [:p.not-found-eyebrow "404"]
                [:h1 title]
                [:p.tag-sub "We couldn't find that page. It may have been removed or never published."]]
               (publish-script)]]]]
    (str "<!doctype html>" (render-hiccup doc))))
