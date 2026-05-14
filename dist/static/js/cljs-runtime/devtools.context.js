goog.provide('devtools.context');
devtools.context.get_root = (function devtools$context$get_root(){
return goog.global;
});
devtools.context.get_console = (function devtools$context$get_console(){
return devtools.context.get_root.call(null).console;
});

//# sourceMappingURL=devtools.context.js.map
