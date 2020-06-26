(ns frontend.handler.dnd
  (:require [frontend.handler :as handler]
            [frontend.config :as config]
            [frontend.util :as util :refer-macros [profile]]
            [frontend.db :as db]
            [clojure.walk :as walk]
            [clojure.string :as string]
            [frontend.utf8 :as utf8]
            [cljs-time.coerce :as tc]
            [cljs-time.core :as t]))

(defn- remove-heading-child!
  [target-heading parent-heading]
  (let [child-ids (set (db/get-heading-ids target-heading))]
    (db/get-heading-content-rec
     parent-heading
     (fn [{:heading/keys [uuid level content]}]
       (if (contains? child-ids uuid)
         ""
         content)))))

(defn- recompute-heading-level
  [to-heading nested?]
  (+ (:heading/level to-heading)
     (if nested? 1 0)))

(defn- recompute-heading-content-and-changes
  [target-heading to-heading nested? same-repo? same-file?]
  (let [new-level (recompute-heading-level to-heading nested?)
        target-level (:heading/level target-heading)
        format (:heading/format target-heading)
        pattern (config/get-heading-pattern format)
        heading-changes (atom [])
        all-content (db/get-heading-content-rec
                     target-heading
                     (fn [{:heading/keys [uuid level content]
                           :as heading}]
                       (let [new-level (+ new-level (- level target-level))
                             new-content (string/replace-first content
                                                               (apply str (repeat level pattern))
                                                               (apply str (repeat new-level pattern)))
                             heading (cond->
                                         {:heading/uuid uuid
                                          :heading/level new-level
                                          :heading/content new-content
                                          :heading/page (:heading/page to-heading)}

                                       (not same-repo?)
                                       (merge (dissoc heading [:heading/level :heading/content]))

                                       (not same-file?)
                                       (merge {:heading/page (:heading/page to-heading)
                                               :heading/file (:heading/file to-heading)}))]
                         (swap! heading-changes conj heading)
                         new-content)))]
    [all-content @heading-changes]))

(defn- move-parent-to-child?
  [target-heading to-heading]
  (let [to-heading-id (:heading/uuid to-heading)
        result (atom false)
        _ (walk/postwalk
           (fn [form]
             (when (map? form)
               (when-let [id (:heading/uuid form)]
                 (when (= id to-heading-id)
                   (reset! result true))))
             form)
           target-heading)]
    @result))

(defn- compute-target-child?
  [target-heading to-heading]
  (let [target-heading-id (:heading/uuid target-heading)
        result (atom false)
        _ (walk/postwalk
           (fn [form]
             (when (map? form)
               (when-let [id (:heading/uuid form)]
                 (when (= id target-heading-id)
                   (reset! result true))))
             form)
           to-heading)]
    @result))

(defn rebuild-dnd-headings
  [repo file target-child? start-pos target-headings offset-heading-uuid {:keys [delete? same-file?]
                                                                          :or {delete? false
                                                                               same-file? true}}]
  (when (seq target-headings)
    (let [file-id (:db/id file)
          target-heading-ids (set (map :heading/uuid target-headings))
          after-headings (->> (db/get-file-after-headings repo file-id start-pos)
                              (remove (fn [h] (contains? target-heading-ids (:heading/uuid h)))))

          after-headings (cond
                           delete?
                           after-headings

                           (and offset-heading-uuid
                                (not (contains? (set (map :heading/uuid after-headings)) offset-heading-uuid)))
                           (concat target-headings after-headings)

                           offset-heading-uuid
                           (let [[before after] (split-with (fn [h] (not= (:heading/uuid h)
                                                                          offset-heading-uuid)) after-headings)]
                             (concat (conj (vec before) (first after))
                                     target-headings
                                     (rest after)))
                           :else
                           (concat target-headings after-headings))
          after-headings (remove nil? after-headings)
          ;; _ (prn {:start-pos start-pos
          ;;         :target-headings target-headings
          ;;         :after-headings (map (fn [heading]
          ;;                                (:heading/content heading))
          ;;                           after-headings)})
          last-start-pos (atom start-pos)
          result (mapv
                  (fn [{:heading/keys [uuid meta content level page] :as heading}]
                    (let [content (str (util/trim-safe content) "\n")
                          target-heading? (contains? target-heading-ids uuid)
                          content-length (if target-heading?
                                           (utf8/length (utf8/encode content))
                                           (- (:end-pos meta) (:pos meta)))
                          new-end-pos (+ @last-start-pos content-length)
                          new-meta {:pos @last-start-pos
                                    :end-pos new-end-pos}]
                      (reset! last-start-pos new-end-pos)
                      (let [data {:heading/uuid uuid
                                  :heading/meta new-meta}]
                        (cond
                          (and target-heading? (not same-file?))
                          (merge
                           (dissoc heading :heading/idx :heading/dummy?)
                           data)

                          target-heading?
                          (merge
                           data
                           {:heading/level level
                            :heading/content content
                            :heading/page page})

                          :else
                          data))))
                  after-headings)]
      result)))

(defn- get-start-pos
  [heading]
  (get-in heading [:heading/meta :pos]))

(defn- get-end-pos
  [heading]
  (get-in heading [:heading/meta :end-pos]))

(defn- compute-direction
  [target-heading top-heading nested? top? target-child?]
  (cond
    (= top-heading target-heading)
    :down

    (and target-child? nested?)
    :up

    (and target-child? (not top?))
    :down

    :else
    :up))

(defn- compute-after-headings-in-same-file
  [repo target-heading to-heading direction top? nested? target-child? target-file original-top-heading-start-pos heading-changes]
  (cond
    top?
    (rebuild-dnd-headings repo target-file target-child?
                          original-top-heading-start-pos
                          heading-changes
                          nil
                          {})

    (= direction :up)
    (let [offset-heading-id (if nested?
                              (:heading/uuid to-heading)
                              (last (db/get-heading-ids to-heading)))
          offset-end-pos (get-end-pos
                          (db/entity repo [:heading/uuid offset-heading-id]))]
      (rebuild-dnd-headings repo target-file target-child?
                            offset-end-pos
                            heading-changes
                            nil
                            {}))

    (= direction :down)
    (let [offset-heading-id (if nested?
                              (:heading/uuid to-heading)
                              (last (db/get-heading-ids to-heading)))
          target-start-pos (get-start-pos target-heading)]
      (rebuild-dnd-headings repo target-file target-child?
                            target-start-pos
                            heading-changes
                            offset-heading-id
                            {}))))

;; TODO: still could be different pages, e.g. move a heading from one journal to another journal
(defn- move-heading-in-same-file
  [repo target-heading to-heading top-heading bottom-heading nested? top? target-child? direction target-content target-file original-top-heading-start-pos heading-changes]
  (if (move-parent-to-child? target-heading to-heading)
    nil
    (let [old-file-content (db/get-file (:file/path (db/entity (:db/id (:heading/file target-heading)))))
          old-file-content (utf8/encode old-file-content)
          subs (fn [start-pos end-pos] (utf8/substring old-file-content start-pos end-pos))
          bottom-content (db/get-heading-content-rec bottom-heading)
          top-content (remove-heading-child! bottom-heading top-heading)
          top-area (subs 0 (get-start-pos top-heading))
          bottom-area (subs
                       (cond
                         (and nested? (= direction :down))
                         (get-end-pos bottom-heading)
                         target-child?
                         (db/get-heading-end-pos-rec repo top-heading)
                         :else
                         (db/get-heading-end-pos-rec repo bottom-heading))
                       nil)
          between-area (if (= direction :down)
                         (subs (db/get-heading-end-pos-rec repo target-heading) (get-start-pos to-heading))
                         (subs (db/get-heading-end-pos-rec repo to-heading) (get-start-pos target-heading)))
          up-content (when (= direction :up)
                       (cond
                         nested?
                         (util/join-newline (:heading/content top-heading)
                                            target-content
                                            (if target-child?
                                              (remove-heading-child! target-heading (:heading/children to-heading))
                                              (db/get-heading-content-rec (:heading/children top-heading))))
                         (and top? target-child?)
                         (util/join-newline target-content (remove-heading-child! target-heading to-heading))

                         top?
                         (util/join-newline target-content top-content)

                         :else
                         (let [top-content (if target-child?
                                             (remove-heading-child! target-heading to-heading)
                                             top-content)]
                           (util/join-newline top-content target-content))))
          down-content (when (= direction :down)
                         (cond
                           nested?
                           (util/join-newline (:heading/content bottom-heading)
                                              target-content)
                           target-child?
                           (util/join-newline top-content target-content)

                           :else
                           (util/join-newline bottom-content target-content)))
          ;; _ (prn {:direction direction
          ;;         :nested? nested?
          ;;         :top? top?
          ;;         :target-child? target-child?
          ;;         :top-area top-area
          ;;         :up-content up-content
          ;;         :between-area between-area
          ;;         :down-content down-content
          ;;         :bottom-area bottom-area
          ;;         })
          new-file-content (string/trim
                            (util/join-newline
                             top-area
                             up-content
                             between-area
                             down-content
                             bottom-area))
          after-headings (->> (compute-after-headings-in-same-file repo target-heading to-heading direction top? nested? target-child? target-file original-top-heading-start-pos heading-changes)
                              (remove nil?))
          path (:file/path (db/entity repo (:db/id (:heading/file to-heading))))
          modified-time (let [modified-at (tc/to-long (t/now))]
                          (->
                           [[:db/add (:db/id (:heading/page target-heading)) :page/last-modified-at modified-at]
                            [:db/add (:db/id (:heading/page to-heading)) :page/last-modified-at modified-at]
                            [:db/add (:db/id (:heading/file target-heading)) :file/last-modified-at modified-at]
                            [:db/add (:db/id (:heading/file to-heading)) :file/last-modified-at modified-at]]
                           distinct
                           vec))]
      (profile
       "Move heading in the same file: "
       (handler/transact-react-and-alter-file!
        repo
        (concat
         after-headings
         modified-time)
        {:key :heading/change
         :data heading-changes}
        [[path new-file-content]]))
      ;; (alter-file repo
      ;;             path
      ;;             new-file-content
      ;;             {:re-render-root? true})
      )))

(defn- move-heading-in-different-files
  [repo target-heading to-heading top-heading bottom-heading nested? top? target-child? direction target-content target-file original-top-heading-start-pos heading-changes]
  (let [target-file (db/entity repo (:db/id (:heading/file target-heading)))
        target-file-path (:file/path target-file)
        target-file-content (db/get-file repo target-file-path)
        to-file (db/entity repo (:db/id (:heading/file to-heading)))
        to-file-path (:file/path to-file)
        target-heading-end-pos (db/get-heading-end-pos-rec repo target-heading)
        to-heading-start-pos (get-start-pos to-heading)
        to-heading-end-pos (db/get-heading-end-pos-rec repo to-heading)
        new-target-file-content (utf8/delete! target-file-content
                                              (get-start-pos target-heading)
                                              target-heading-end-pos)
        to-file-content (utf8/encode (db/get-file repo to-file-path))
        new-to-file-content (let [separate-pos (cond nested?
                                                     (get-end-pos to-heading)
                                                     top?
                                                     to-heading-start-pos
                                                     :else
                                                     to-heading-end-pos)]
                              (string/trim
                               (util/join-newline
                                (utf8/substring to-file-content 0 separate-pos)
                                target-content
                                (utf8/substring to-file-content separate-pos))))
        modified-time (let [modified-at (tc/to-long (t/now))]
                        (->
                         [[:db/add (:db/id (:heading/page target-heading)) :page/last-modified-at modified-at]
                          [:db/add (:db/id (:heading/page to-heading)) :page/last-modified-at modified-at]
                          [:db/add (:db/id (:heading/file target-heading)) :file/last-modified-at modified-at]
                          [:db/add (:db/id (:heading/file to-heading)) :file/last-modified-at modified-at]]
                         distinct
                         vec))
        target-after-headings (rebuild-dnd-headings repo target-file target-child?
                                                    (get-start-pos target-heading)
                                                    heading-changes nil {:delete? true})
        to-after-headings (cond
                            top?
                            (rebuild-dnd-headings repo to-file target-child?
                                                  (get-start-pos to-heading)
                                                  heading-changes
                                                  nil
                                                  {:same-file? false})

                            :else
                            (let [offset-heading-id (if nested?
                                                      (:heading/uuid to-heading)
                                                      (last (db/get-heading-ids to-heading)))
                                  offset-end-pos (get-end-pos
                                                  (db/entity repo [:heading/uuid offset-heading-id]))]
                              (rebuild-dnd-headings repo to-file target-child?
                                                    offset-end-pos
                                                    heading-changes
                                                    nil
                                                    {:same-file? false})))]
    (profile
     "Move heading between different files: "
     (handler/transact-react-and-alter-file!
      repo
      (concat
       target-after-headings
       to-after-headings
       modified-time)
      {:key :heading/change
       :data (conj heading-changes target-heading)}
      [[target-file-path new-target-file-content]
       [to-file-path new-to-file-content]]))))

(defn- move-heading-in-different-repos
  [target-heading-repo to-heading-repo target-heading to-heading top-heading bottom-heading nested? top? target-child? direction target-content target-file original-top-heading-start-pos heading-changes]
  (let [target-file (db/entity target-heading-repo (:db/id (:heading/file target-heading)))
        target-file-path (:file/path target-file)
        target-file-content (db/get-file target-heading-repo target-file-path)
        to-file (db/entity to-heading-repo (:db/id (:heading/file to-heading)))
        to-file-path (:file/path to-file)
        target-heading-end-pos (db/get-heading-end-pos-rec target-heading-repo target-heading)
        to-heading-start-pos (get-start-pos to-heading)
        to-heading-end-pos (db/get-heading-end-pos-rec to-heading-repo to-heading)
        new-target-file-content (utf8/delete! target-file-content
                                              (get-start-pos target-heading)
                                              target-heading-end-pos)
        to-file-content (utf8/encode (db/get-file to-heading-repo to-file-path))
        new-to-file-content (let [separate-pos (cond nested?
                                                     (get-end-pos to-heading)
                                                     top?
                                                     to-heading-start-pos
                                                     :else
                                                     to-heading-end-pos)]
                              (string/trim
                               (util/join-newline
                                (utf8/substring to-file-content 0 separate-pos)
                                target-content
                                (utf8/substring to-file-content separate-pos))))
        target-delete-tx (map (fn [id]
                                [:db.fn/retractEntity [:heading/uuid id]])
                           (db/get-heading-ids target-heading))
        [target-modified-time to-modified-time]
        (let [modified-at (tc/to-long (t/now))]
          [[[:db/add (:db/id (:heading/page target-heading)) :page/last-modified-at modified-at]
            [:db/add (:db/id (:heading/file target-heading)) :file/last-modified-at modified-at]]
           [[:db/add (:db/id (:heading/page to-heading)) :page/last-modified-at modified-at]
            [:db/add (:db/id (:heading/file to-heading)) :file/last-modified-at modified-at]]])
        target-after-headings (rebuild-dnd-headings target-heading-repo target-file target-child?
                                                    (get-start-pos target-heading)
                                                    heading-changes nil {:delete? true})
        to-after-headings (cond
                            top?
                            (rebuild-dnd-headings to-heading-repo to-file target-child?
                                                  (get-start-pos to-heading)
                                                  heading-changes
                                                  nil
                                                  {:same-file? false})

                            :else
                            (let [offset-heading-id (if nested?
                                                      (:heading/uuid to-heading)
                                                      (last (db/get-heading-ids to-heading)))
                                  offset-end-pos (get-end-pos
                                                  (db/entity to-heading-repo [:heading/uuid offset-heading-id]))]
                              (rebuild-dnd-headings to-heading-repo to-file target-child?
                                                    offset-end-pos
                                                    heading-changes
                                                    nil
                                                    {:same-file? false})))]
    (profile
     "[Target file] Move heading between different files: "
     (handler/transact-react-and-alter-file!
      target-heading-repo
      (concat
       target-delete-tx
       target-after-headings
       target-modified-time)
      {:key :heading/change
       :data [(dissoc target-heading :heading/children)]}
      [[target-file-path new-target-file-content]]))

    (profile
     "[Destination file] Move heading between different files: "
     (handler/transact-react-and-alter-file!
      to-heading-repo
      (concat
       to-after-headings
       to-modified-time)
      {:key :heading/change
       :data [heading-changes]}
      [[to-file-path new-to-file-content]]))))

(defn move-heading
  "There can be at least 3 possible situations:
  1. Move a heading in the same file (either top-to-bottom or bottom-to-top).
  2. Move a heading between two different files.
  3. Move a heading between two files in different repos.

  Notes:
  1. Those two headings might have different formats, e.g. one is `org` and another is `markdown`,
     we don't handle this now. TODO: transform between different formats in mldoc.
  2. Sometimes we might need to move a parent heading to it's own child.
  "
  [target-heading to-heading target-dom-id top? nested?]
  (when (and target-heading to-heading (:heading/format target-heading) (:heading/format to-heading))
    (cond
      (not= (:heading/format target-heading)
            (:heading/format to-heading))
      (handler/show-notification!
       (util/format "Sorry, you can't move a block of format %s to another file of format %s."
                    (:heading/format target-heading)
                    (:heading/format to-heading))
       :error)

      (= (:heading/uuid target-heading) (:heading/uuid to-heading))
      nil

      :else
      (let [pattern (config/get-heading-pattern (:heading/format to-heading))
            target-heading-repo (:heading/repo target-heading)
            to-heading-repo (:heading/repo to-heading)
            target-heading (assoc target-heading
                                  :heading/meta
                                  (:heading/meta (db/entity target-heading-repo [:heading/uuid (:heading/uuid target-heading)])))
            to-heading (assoc to-heading
                              :heading/meta
                              (:heading/meta (db/entity [:heading/uuid (:heading/uuid to-heading)])))
            same-repo? (= target-heading-repo to-heading-repo)
            target-file (:heading/file target-heading)
            same-file? (and
                        same-repo?
                        (= (:db/id target-file)
                           (:db/id (:heading/file to-heading))))
            [top-heading bottom-heading] (if same-file?
                                           (if (< (get-start-pos target-heading)
                                                  (get-start-pos to-heading))
                                             [target-heading to-heading]
                                             [to-heading target-heading])
                                           [nil nil])
            target-child? (compute-target-child? target-heading to-heading)
            direction (compute-direction target-heading top-heading nested? top? target-child?)
            original-top-heading-start-pos (get-start-pos top-heading)
            [target-content heading-changes] (recompute-heading-content-and-changes target-heading to-heading nested? same-repo? same-file?)]
        (cond
          same-file?
          (move-heading-in-same-file target-heading-repo target-heading to-heading top-heading bottom-heading nested? top? target-child? direction target-content target-file original-top-heading-start-pos heading-changes)

          ;; same repo but different files
          same-repo?
          (move-heading-in-different-files target-heading-repo target-heading to-heading top-heading bottom-heading nested? top? target-child? direction target-content target-file original-top-heading-start-pos heading-changes)

          ;; different repos
          :else
          (move-heading-in-different-repos target-heading-repo to-heading-repo target-heading to-heading top-heading bottom-heading nested? top? target-child? direction target-content target-file original-top-heading-start-pos heading-changes))))))
