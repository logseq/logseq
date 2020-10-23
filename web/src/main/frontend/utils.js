// Copy from https://github.com/primetwig/react-nestable/blob/dacea9dc191399a3520f5dc7623f5edebc83e7b7/dist/utils.js
export var closest = function closest(target, selector) {
  // closest(e.target, '.field')
  while (target) {
    if (target.matches && target.matches(selector)) return target;
    target = target.parentNode;
  }
  return null;
};

export var getOffsetRect = function getOffsetRect(elem) {
  // (1)
  var box = elem.getBoundingClientRect();

  var body = document.body;
  var docElem = document.documentElement;

  // (2)
  var scrollTop = window.pageYOffset || docElem.scrollTop || body.scrollTop;
  var scrollLeft = window.pageXOffset || docElem.scrollLeft || body.scrollLeft;

  // (3)
  var clientTop = docElem.clientTop || body.clientTop || 0;
  var clientLeft = docElem.clientLeft || body.clientLeft || 0;

  // (4)
  var top = box.top + scrollTop - clientTop;
  var left = box.left + scrollLeft - clientLeft;

  return { top: Math.round(top), left: Math.round(left) };
};

// jquery focus
export var focus = function( elem ) {
  return elem === document.activeElement &&
    document.hasFocus() &&
    !!( elem.type || elem.href || ~elem.tabIndex );
}

// copied from https://stackoverflow.com/a/32180863
export var timeConversion = function (millisec) {
  var seconds = (millisec / 1000).toFixed(0);
  var minutes = (millisec / (1000 * 60)).toFixed(0);
  var hours = (millisec / (1000 * 60 * 60)).toFixed(1);
  var days = (millisec / (1000 * 60 * 60 * 24)).toFixed(1);

  if (seconds < 60) {
    return seconds + "s";
  } else if (minutes < 60) {
    return minutes + "m";
  } else if (hours < 24) {
    return hours + "h";
  } else {
    return days + "d"
  }
}
