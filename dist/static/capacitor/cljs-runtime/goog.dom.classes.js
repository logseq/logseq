goog.provide("goog.dom.classes");
goog.require("goog.array");
goog.dom.classes.set = function(element, className) {
  element.className = className;
};
goog.dom.classes.get = function(element) {
  var className = element.className;
  return typeof className === "string" && className.match(/\S+/g) || [];
};
goog.dom.classes.add = function(element, var_args) {
  var classes = goog.dom.classes.get(element);
  var args = Array.prototype.slice.call(arguments, 1);
  var expectedCount = classes.length + args.length;
  goog.dom.classes.add_(classes, args);
  goog.dom.classes.set(element, classes.join(" "));
  return classes.length == expectedCount;
};
goog.dom.classes.remove = function(element, var_args) {
  var classes = goog.dom.classes.get(element);
  var args = Array.prototype.slice.call(arguments, 1);
  var newClasses = goog.dom.classes.getDifference_(classes, args);
  goog.dom.classes.set(element, newClasses.join(" "));
  return newClasses.length == classes.length - args.length;
};
goog.dom.classes.add_ = function(classes, args) {
  for (var i = 0; i < args.length; i++) {
    if (!goog.array.contains(classes, args[i])) {
      classes.push(args[i]);
    }
  }
};
goog.dom.classes.getDifference_ = function(arr1, arr2) {
  return arr1.filter(function(item) {
    return !goog.array.contains(arr2, item);
  });
};
goog.dom.classes.swap = function(element, fromClass, toClass) {
  var classes = goog.dom.classes.get(element);
  var removed = false;
  for (var i = 0; i < classes.length; i++) {
    if (classes[i] == fromClass) {
      classes.splice(i--, 1);
      removed = true;
    }
  }
  if (removed) {
    classes.push(toClass);
    goog.dom.classes.set(element, classes.join(" "));
  }
  return removed;
};
goog.dom.classes.addRemove = function(element, classesToRemove, classesToAdd) {
  var classes = goog.dom.classes.get(element);
  if (typeof classesToRemove === "string") {
    goog.array.remove(classes, classesToRemove);
  } else if (Array.isArray(classesToRemove)) {
    classes = goog.dom.classes.getDifference_(classes, classesToRemove);
  }
  if (typeof classesToAdd === "string" && !goog.array.contains(classes, classesToAdd)) {
    classes.push(classesToAdd);
  } else if (Array.isArray(classesToAdd)) {
    goog.dom.classes.add_(classes, classesToAdd);
  }
  goog.dom.classes.set(element, classes.join(" "));
};
goog.dom.classes.has = function(element, className) {
  return goog.array.contains(goog.dom.classes.get(element), className);
};
goog.dom.classes.enable = function(element, className, enabled) {
  if (enabled) {
    goog.dom.classes.add(element, className);
  } else {
    goog.dom.classes.remove(element, className);
  }
};
goog.dom.classes.toggle = function(element, className) {
  var add = !goog.dom.classes.has(element, className);
  goog.dom.classes.enable(element, className, add);
  return add;
};

//# sourceMappingURL=goog.dom.classes.js.map
