(ns frontend.mui
  (:refer-clojure :exclude [list stepper])
  (:require [rum.core]
            [frontend.rum :as r]
            ["@material-ui/core" :refer [MuiThemeProvider]]
            ["@material-ui/core/styles" :refer [createMuiTheme withStyles makeStyles]]
            ["@material-ui/core/colors" :as colors]
            ["@material-ui/core/CssBaseline" :default CssBaseline]
            ["@material-ui/core/Typography" :default Typography]
            ["@material-ui/core/Avatar" :default mui-avatar]
            ["@material-ui/icons/Android" :default AndroidIcon]
            ["@material-ui/core/AppBar" :default AppBar]
            ["@material-ui/core/Divider" :default Divider]
            ["@material-ui/core/Paper" :default Paper]
            ["@material-ui/core/Toolbar" :default ToolBar]
            ["@material-ui/core/IconButton" :default IconButton]
            ["@material-ui/icons/Menu" :default MenuIcon]
            ["@material-ui/core/Button" :default Button]
            ["@material-ui/core/SwipeableDrawer" :default SwipeableDrawer]
            ["@material-ui/core/Chip" :default Chip]
            ["@material-ui/core/Fab" :default Fab]
            ["@material-ui/core/List" :default List]
            ["@material-ui/core/ListItem" :default ListItem]
            ["@material-ui/core/ListItemText" :default ListItemText]
            ["@material-ui/core/Container" :default Container]
            ["@material-ui/core/Box" :default Box]
            ["@material-ui/core/Snackbar" :default Snackbar]
            ["@material-ui/core/Link" :default Link]
            ["@material-ui/core/Checkbox" :default Checkbox]
            ["@material-ui/core/Grid" :default Grid]
            ["@material-ui/core/GridList" :default GridList]
            ["@material-ui/core/Hidden" :default Hidden]
            ;; ["@material-ui/core/Form" :default Form]
            ["@material-ui/core/TextField" :default TextField]
            ["@material-ui/core/TextareaAutosize" :default TextareaAutosize]
            ["@material-ui/core/Card" :default Card]
            ["@material-ui/core/CardActions" :default CardActions]
            ["@material-ui/core/CardContent" :default CardContent]
            ["@material-ui/core/CardHeader" :default CardHeader]
            ["@material-ui/core/CardMedia" :default CardMedia]
            ["@material-ui/core/Collapse" :default Collapse]
            ["@material-ui/core/Avatar" :default Avatar]
            ["@material-ui/core/CircularProgress" :default CircularProgress]
            ["@material-ui/core/Badge" :default Badge]
            ["@material-ui/core/Tooltip" :default Tooltip]
            ["@material-ui/core/Dialog" :default Dialog]
            ["@material-ui/core/DialogTitle" :default DialogTitle]
            ["@material-ui/core/DialogContent" :default DialogContent]
            ["@material-ui/core/DialogActions" :default DialogActions]
            ["@material-ui/icons/Favorite" :default FavoriteIcon]
            ["@material-ui/icons/Add" :default AddIcon]
            ["@material-ui/icons/Share" :default ShareIcon]
            ["@material-ui/icons/MoreVert" :default MoreVertIcon]
            ))

(defn custom-theme []
  (createMuiTheme
   (clj->js
    {:palette
     {:type       "light"
      ;; :primary    (.-purple colors)
      ;; :secondary  (.-green colors)
      }
     :typography
     {:useNextVariants true}})))

(defonce theme-provider (r/adapt-class MuiThemeProvider))
(defonce css-baseline (r/adapt-class CssBaseline))
(defonce app-bar (r/adapt-class AppBar))
(defonce divider (r/adapt-class Divider))
(defonce tool-bar (r/adapt-class ToolBar))
(defonce button (r/adapt-class Button))
(defonce icon-button (r/adapt-class IconButton))
(defonce typography (r/adapt-class Typography))
(defonce container (r/adapt-class Container))
(defonce box (r/adapt-class Box))
(defonce snackbar (r/adapt-class Snackbar))
(defonce link (r/adapt-class Link))
(defonce checkbox (r/adapt-class Checkbox))
(defonce grid (r/adapt-class Grid))
(defonce grid-list (r/adapt-class GridList))
(defonce paper (r/adapt-class Paper))
(defonce collapse (r/adapt-class Collapse))
(defonce avatar (r/adapt-class Avatar))
(defonce favorite-icon (r/adapt-class FavoriteIcon))
(defonce add-icon (r/adapt-class AddIcon))
(defonce fab (r/adapt-class Fab))
(defonce share-icon (r/adapt-class ShareIcon))
(defonce more-vert-icon (r/adapt-class MoreVertIcon))
(defonce circular-progress (r/adapt-class CircularProgress))
(defonce badge (r/adapt-class Badge))
(defonce text-field (r/adapt-class TextField))
(defonce textarea (r/adapt-class TextareaAutosize))
(defonce tooltip (r/adapt-class Tooltip))
(defonce dialog (r/adapt-class Dialog))
(defonce dialog-title (r/adapt-class DialogTitle))
(defonce dialog-content (r/adapt-class DialogContent))
(defonce dialog-actions (r/adapt-class DialogActions))
(defonce menu-icon (r/adapt-class MenuIcon))
(defonce drawer (r/adapt-class SwipeableDrawer))
(defonce chip (r/adapt-class Chip))
(defonce list (r/adapt-class List))
(defonce list-item (r/adapt-class ListItem))
(defonce list-item-text (r/adapt-class ListItemText))

;; card
(defonce card (r/adapt-class Card))
(defonce card-actions (r/adapt-class CardActions))
(defonce card-content (r/adapt-class CardContent))
(defonce card-actions (r/adapt-class CardActions))
(defonce card-header (r/adapt-class CardHeader))
(defonce card-media (r/adapt-class CardMedia))
