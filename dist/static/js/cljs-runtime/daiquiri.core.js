goog.provide('daiquiri.core');
/**
 * The React.js create element function.
 */
daiquiri.core.create_element = (function daiquiri$core$create_element(type,attrs,children){
if(children){
return React.createElement.apply(null,[type,attrs].concat(children));
} else {
return React.createElement(type,attrs);
}
});
/**
 * The React.js Fragment.
 */
daiquiri.core.fragment = React.Fragment;

//# sourceMappingURL=daiquiri.core.js.map
