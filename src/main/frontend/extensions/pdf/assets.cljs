(ns frontend.extensions.pdf.assets
  (:require [cljs.reader :as reader]
            [clojure.string :as string]
            [frontend.config :as config]
            [frontend.db.model :as db-model]
            [frontend.db.utils :as db-utils]
            [frontend.fs :as fs]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.page :as page-handler]
            [frontend.util.page-property :as page-property]
            [frontend.state :as state]
            [frontend.util :as util]
            [logseq.graph-parser.config :as gp-config]
            [logseq.graph-parser.util.block-ref :as block-ref]
            [medley.core :as medley]
            [promesa.core :as p]
            [reitit.frontend.easy :as rfe]
            [rum.core :as rum]))

(defn hls-file?
  [filename]
  (and filename (string? filename) (string/starts-with? filename "hls__")))

(defn inflate-asset
  [full-path]
  (let [filename (util/node-path.basename full-path)
        web-link? (string/starts-with? full-path "http")
        ext-name (util/get-file-ext filename)
        url (cond
              web-link?
              full-path

              (util/absolute-path? full-path)
              (str "file://" full-path)

              (string/starts-with? full-path "file:/")
              full-path

              :else
              (let [full-path (string/replace full-path #"^[.\/\\]+" "")
                    full-path (if-not (string/starts-with? full-path gp-config/local-assets-dir)
                                (util/node-path.join gp-config/local-assets-dir full-path)
                                full-path)]
                (str "file://"  ;; TODO: bfs
                     (util/node-path.join
                       (config/get-repo-dir (state/get-current-repo))
                       full-path))))]
    (when-let [key
               (if web-link?
                 (str (hash url))
                 (and
                   (= ext-name "pdf")
                   (subs filename 0 (- (count filename) 4))))]
      {:key      key
       :identity (subs key (- (count key) 15))
       :filename filename
       :url      url
       :hls-file (str "assets/" key ".edn")})))

(defn load-hls-data$
  [{:keys [hls-file]}]
  (when hls-file
    (let [repo-cur (state/get-current-repo)
          repo-dir (config/get-repo-dir repo-cur)]
      (p/let [_ (fs/create-if-not-exists repo-cur repo-dir hls-file "{:highlights []}")
              res (fs/read-file repo-dir hls-file)
              data (if res (reader/read-string res) {})]
        data))))

(defn persist-hls-data$
  [{:keys [hls-file]} highlights]
  (when hls-file
    (let [repo-cur (state/get-current-repo)
          repo-dir (config/get-repo-dir repo-cur)
          data (pr-str {:highlights highlights})]
      (fs/write-file! repo-cur repo-dir hls-file data {:skip-compare? true}))))

(defn resolve-hls-data-by-key$
  [target-key]
  ;; TODO: fuzzy match
  (when-let [hls-file (and target-key (str gp-config/local-assets-dir "/" target-key ".edn"))]
    (load-hls-data$ {:hls-file hls-file})))

(defn area-highlight?
  [hl]
  (and hl (not (nil? (get-in hl [:content :image])))))

(defn persist-hl-area-image$
  [^js viewer current new-hl old-hl {:keys [top left width height]}]
  (when-let [^js canvas (and (:key current) (.-canvas (.getPageView viewer (dec (:page new-hl)))))]
    (let [^js doc (.-ownerDocument canvas)
          ^js canvas' (.createElement doc "canvas")
          dpr js/window.devicePixelRatio
          repo-cur (state/get-current-repo)
          repo-dir (config/get-repo-dir repo-cur)
          dw (* dpr width)
          dh (* dpr height)]

      (set! (. canvas' -width) dw)
      (set! (. canvas' -height) dh)

      (when-let [^js ctx (.getContext canvas' "2d" #js{:alpha false})]
        (set! (. ctx -imageSmoothingEnabled) false)
        (.drawImage
          ctx canvas
          (* left dpr) (* top dpr) (* width dpr) (* height dpr)
          0 0 dw dh)

        (let [callback (fn [^js png]
                         ;; write image file
                         (p/catch
                           (p/let [_ (js/console.time :write-area-image)
                                   ^js png (.arrayBuffer png)
                                   {:keys [key]} current
                                   ;; dir
                                   fstamp (get-in new-hl [:content :image])
                                   old-fstamp (and old-hl (get-in old-hl [:content :image]))
                                   fname (str (:page new-hl) "_" (:id new-hl))
                                   fdir (str gp-config/local-assets-dir "/" key)
                                   _ (fs/mkdir-if-not-exists (str repo-dir "/" fdir))
                                   new-fpath (str fdir "/" fname "_" fstamp ".png")
                                   old-fpath (and old-fstamp (str fdir "/" fname "_" old-fstamp ".png"))
                                   _ (and old-fpath (apply fs/rename! repo-cur (map #(util/node-path.join repo-dir %) [old-fpath new-fpath])))
                                   _ (fs/write-file! repo-cur repo-dir new-fpath png {:skip-compare? true})]

                             (js/console.timeEnd :write-area-image))

                           (fn [err]
                             (js/console.error "[write area image Error]" err))))]

          (.toBlob canvas' callback))
        ))))

(defn update-hl-area-block!
  [highlight]
  (when-let [block (and (area-highlight? highlight)
                        (db-model/get-block-by-uuid (:id highlight)))]
    (editor-handler/set-block-property!
      (:block/uuid block) :hl-stamp (get-in highlight [:content :image]))))

(defn unlink-hl-area-image$
  [^js _viewer current hl]
  (when-let [fkey (and (area-highlight? hl) (:key current))]
    (let [repo-cur (state/get-current-repo)
          repo-dir (config/get-repo-dir repo-cur)
          fstamp (get-in hl [:content :image])
          fname (str (:page hl) "_" (:id hl))
          fdir (str gp-config/local-assets-dir "/" fkey)
          fpath (util/node-path.join repo-dir (str fdir "/" fname "_" fstamp ".png"))]

      (fs/unlink! repo-cur fpath {}))))

(defn resolve-ref-page
  [pdf-current]
  (let [page-name (:key pdf-current)
        page-name (string/trim page-name)
        page-name (str "hls__" page-name)
        page (db-model/get-page page-name)
        url (:url pdf-current)
        format (state/get-preferred-format)
        repo-dir (config/get-repo-dir (state/get-current-repo))
        asset-dir (util/node-path.join repo-dir gp-config/local-assets-dir)
        url (if (string/includes? url asset-dir)
              (str ".." (last (string/split url repo-dir)))
              url)]
    (if-not page
      (let [label (:filename pdf-current)]
        (page-handler/create! page-name {:redirect?        false :create-first-block? false
                                         :split-namespace? false
                                         :format           format
                                         :properties       {:file      (case format
                                                                         :markdown
                                                                         (util/format "[%s](%s)" label url)

                                                                         :org
                                                                         (util/format "[[%s][%s]]" url label)

                                                                         url)
                                                            :file-path url}})
        (db-model/get-page page-name))

      ;; try to update file path
      (page-property/add-property! page-name :file-path url))
    page))

(defn create-ref-block!
  [{:keys [id content page]}]
  (when-let [pdf-current (:pdf/current @state/state)]
    (when-let [ref-page (resolve-ref-page pdf-current)]
      (if-let [ref-block (db-model/get-block-by-uuid id)]
        (do
          (js/console.debug "[existed ref block]" ref-block)
          ref-block)
        (let [text (:text content)
              wrap-props #(if-let [stamp (:image content)]
                            (assoc % :hl-type "area" :hl-stamp stamp) %)]

          (editor-handler/api-insert-new-block!
            text {:page        (:block/name ref-page)
                  :custom-uuid id
                  :properties  (wrap-props
                                 {:ls-type "annotation"
                                  :hl-page page
                                  ;; force custom uuid
                                  :id      (str id)})}))))))

(defn del-ref-block!
  [{:keys [id]}]
  #_:clj-kondo/ignore
  (when-let [repo (state/get-current-repo)]
    (when-let [block (db-model/get-block-by-uuid id)]
      (editor-handler/delete-block-aux! block true))))

(defn copy-hl-ref!
  [highlight]
  (when-let [ref-block (create-ref-block! highlight)]
    (util/copy-to-clipboard! (block-ref/->block-ref (:block/uuid ref-block)))))

(defn open-block-ref!
  [block]
  (let [id (:block/uuid block)
        page (db-utils/pull (:db/id (:block/page block)))
        page-name (:block/original-name page)
        file-path (:file-path (:block/properties page))]
    (when-let [target-key (and page-name (subs page-name 5))]
      (p/let [hls (resolve-hls-data-by-key$ target-key)
              hls (and hls (:highlights hls))]
        (let [file-path (if file-path file-path (str target-key ".pdf"))]
          (if-let [matched (and hls (medley/find-first #(= id (:id %)) hls))]
            (do
              (state/set-state! :pdf/ref-highlight matched)
              ;; open pdf viewer
              (state/set-state! :pdf/current (inflate-asset file-path)))
            (js/console.debug "[Unmatched highlight ref]" block)))))))

(defn goto-block-ref!
  [{:keys [id]}]
  (when id
    (rfe/push-state :page {:name (str id)})))

(defn goto-annotations-page!
  ([current] (goto-annotations-page! current nil))
  ([current id]
   (when-let [name (:key current)]
     (rfe/push-state :page {:name (str "hls__" name)} (if id {:anchor (str "block-content-" + id)} nil)))))

(rum/defc area-display
  [block stamp]
  (let [id (:block/uuid block)
        props (:block/properties block)]
    (when-let [page (db-utils/pull (:db/id (:block/page block)))]
      (when-let [group-key (string/replace-first (:block/original-name page) #"^hls__" "")]
        (when-let [hl-page (:hl-page props)]
          (let [encoded-chars? (boolean (re-find #"(?i)%[0-9a-f]{2}" group-key))
                group-key (if encoded-chars? (js/encodeURI group-key) group-key)
                asset-path (editor-handler/make-asset-url
                             (str "/" gp-config/local-assets-dir "/" group-key "/" (str hl-page "_" id "_" stamp ".png")))]
            [:span.hl-area
             [:img {:src asset-path}]]))))))

(defn fix-local-asset-filename
  [filename]
  (when-not (string/blank? filename)
    (let [local-asset? (re-find #"[0-9]{13}_\d$" filename)
          hls? (and local-asset? (re-find #"^hls__" filename))]
      (if (or local-asset? hls?)
        (-> filename
            (subs 0 (- (count filename) 15))
            (string/replace #"^hls__" "")
            (string/replace "_" " ")
            (string/trimr))
        filename))))

(rum/defc human-hls-filename-display
  [title]
  (when (string/starts-with? title "hls__")
    [:a.asset-ref
     (fix-local-asset-filename title)]))
