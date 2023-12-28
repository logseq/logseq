(ns frontend.modules.file.core
  "Convert block trees to content"
  (:require [clojure.string :as string]
            [frontend.db :as db]
            [frontend.state :as state]
            [frontend.handler.file-based.property.util :as property-util]))

(defn- indented-block-content
  [content spaces-tabs]
  (let [lines (string/split-lines content)]
    (string/join (str "\n" spaces-tabs) lines)))

(defn- content-with-collapsed-state
  "Only accept nake content (without any indentation)"
  [_repo format content collapsed?]
  (cond
    collapsed?
    (property-util/insert-property format content :collapsed true)

    ;; Don't check properties. Collapsed is an internal state log as property in file, but not counted into properties
    (false? collapsed?)
    (property-util/remove-property format :collapsed content)

    :else
    content))

(defn transform-content
  [{:block/keys [collapsed? format pre-block? content left page parent properties] :as b} level {:keys [heading-to-list?]}]
  (let [repo (state/get-current-repo)
        block-ref-not-saved? (and (seq (:block/_refs (db/entity (:db/id b))))
                                  (not (string/includes? content (str (:block/uuid b)))))
        heading (:heading properties)
        markdown? (= :markdown format)
        content (or content "")
        pre-block? (or pre-block?
                       (and (= page parent left) ; first block
                            markdown?
                            (string/includes? (first (string/split-lines content)) ":: ")))
        content (cond
                  pre-block?
                  (let [content (string/trim content)]
                    (str content "\n"))

                  :else
                  (let [
                        ;; first block is a heading, Markdown users prefer to remove the `-` before the content
                        markdown-top-heading? (and markdown?
                                                   (= parent page left)
                                                   heading)
                        [prefix spaces-tabs]
                        (cond
                          (= format :org)
                          [(->>
                            (repeat level "*")
                            (apply str)) ""]

                          markdown-top-heading?
                          ["" ""]

                          :else
                          (let [level (if (and heading-to-list? heading)
                                        (if (> heading 1)
                                          (dec heading)
                                          heading)
                                        level)
                                spaces-tabs (->>
                                             (repeat (dec level) (state/get-export-bullet-indentation))
                                             (apply str))]
                            [(str spaces-tabs "-") (str spaces-tabs "  ")]))
                        content (if heading-to-list?
                                  (-> (string/replace content #"^\s?#+\s+" "")
                                      (string/replace #"^\s?#+\s?$" ""))
                                  content)
                        content (content-with-collapsed-state repo format content collapsed?)
                        new-content (indented-block-content (string/trim content) spaces-tabs)
                        sep (if (or markdown-top-heading?
                                    (string/blank? new-content))
                              ""
                              " ")]
                    (str prefix sep new-content)))
        content (if block-ref-not-saved?
                  (property-util/insert-property format content :id (str (:block/uuid b)))
                  content)]
    content))


(defn- tree->file-content-aux
  [tree {:keys [init-level] :as opts}]
  (let [block-contents (transient [])]
    (loop [[f & r] tree level init-level]
      (if (nil? f)
        (->> block-contents persistent! flatten (remove nil?))
        (let [page? (nil? (:block/page f))
              content (if page? nil (transform-content f level opts))
              new-content
              (if-let [children (seq (:block/children f))]
                     (cons content (tree->file-content-aux children {:init-level (inc level)}))
                     [content])]
          (conj! block-contents new-content)
          (recur r level))))))

(defn tree->file-content
  [tree opts]
  (->> (tree->file-content-aux tree opts) (string/join "\n")))
