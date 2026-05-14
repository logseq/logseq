var isDescendant$$module$frontend$selection = (parent, child) => {
  let node = child;
  for (; node != null;) {
    if (node == parent) {
      return true;
    }
    node = node.parentNode;
  }
  return false;
};
var getNodesBetween$$module$frontend$selection = (rootNode, node1, node2) => {
  const resultNodes = [];
  let isBetweenNodes = false;
  for (let i = 0; i < rootNode.childNodes.length; i += 1) {
    if (isDescendant$$module$frontend$selection(rootNode.childNodes[i], node1) || isDescendant$$module$frontend$selection(rootNode.childNodes[i], node2)) {
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
  }
  if (resultNodes.length == 0) {
    return [rootNode];
  } else if (isDescendant$$module$frontend$selection(resultNodes[resultNodes.length - 1], node1) || isDescendant$$module$frontend$selection(resultNodes[resultNodes.length - 1], node2)) {
    return resultNodes;
  } else {
    return [resultNodes[0]];
  }
};
var getSelectedNodes$$module$frontend$selection = (selectionAncestor, startNode) => {
  let selection = null;
  if (window.getSelection) {
    selection = window.getSelection();
  } else if (document.selection) {
    selection = document.selection;
  }
  if (selection) {
    if (selection.isCollapsed) {
      return [];
    }
    const node2 = selection.focusNode;
    return getNodesBetween$$module$frontend$selection(selectionAncestor, startNode, node2);
  }
};
var clearSelection$$module$frontend$selection = () => {
  let selection = null;
  if (window.getSelection) {
    selection = window.getSelection();
  } else if (document.selection) {
    selection = document.selection;
  }
  if (selection) {
    if (selection.empty) {
      selection.empty();
    }
    if (selection.removeAllRanges) {
      selection.removeAllRanges();
    }
  }
};
/** @const */ 
var module$frontend$selection = {};
/** @const */ 
module$frontend$selection.clearSelection = clearSelection$$module$frontend$selection;
/** @const */ 
module$frontend$selection.getSelectedNodes = getSelectedNodes$$module$frontend$selection;

$CLJS.module$frontend$selection=module$frontend$selection;
//# sourceMappingURL=module$frontend$selection.js.map
