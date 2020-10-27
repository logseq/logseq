// Copied from https://stackoverflow.com/a/20336116
function isDescendant(parent, child) {
     // from http://stackoverflow.com/questions/2234979/how-to-check-in-javascript-if-one-element-is-a-child-of-another
     var node = child;
     while (node != null) {
         if (node == parent) {
             return true;
         }
         node = node.parentNode;
     }
     return false;
}

function getNodesBetween(rootNode, node1, node2) {
  var resultNodes = [];
  var isBetweenNodes = false;
  for (var i = 0; i < rootNode.childNodes.length; i+= 1) {
    if (isDescendant(rootNode.childNodes[i], node1) || isDescendant(rootNode.childNodes[i], node2)) {
      if (resultNodes.length == 0) {
        isBetweenNodes = true;
      } else {
        isBetweenNodes = false;
      }
      resultNodes.push(rootNode.childNodes[i]);
    } else if (resultNodes.length == 0) {
    } else if (isBetweenNodes) {
      resultNodes.push(rootNode.childNodes[i]);
    } else {
      return resultNodes;
    }
  };
 if (resultNodes.length == 0) {
    return [rootNode];
  } else if (isDescendant(resultNodes[resultNodes.length - 1], node1) || isDescendant(resultNodes[resultNodes.length - 1], node2)) {
    return resultNodes;
  } else {
    // same child node for both should never happen
    return [resultNodes[0]];
  }
}

export var getSelectedNodes = function (selectionAncestor, startNode) {
  // from https://developer.mozilla.org/en-US/docs/Web/API/Selection
  var selection = null;
  if(window.getSelection){
    selection = window.getSelection();
  } else if(document.selection){
    selection = document.selection;
  }

  if(selection) {
    if (selection.isCollapsed) {
      return [];
    };
    var node2 = selection.focusNode;
    return getNodesBetween(selectionAncestor, startNode, node2);
  }
};

export var clearSelection = function () {
  var selection = null;
  if(window.getSelection){
    selection = window.getSelection();
  } else if(document.selection){
    selection = document.selection;
  }
  if(selection){
    if(selection.empty){
      selection.empty();
    }
    if(selection.removeAllRanges){
      selection.removeAllRanges();
    }
  }
}
