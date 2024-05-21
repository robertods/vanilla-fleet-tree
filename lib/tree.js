class Tree {
  constructor(container, options) {
    this.options = {
      selectMode: "checkbox",
      values: [],
      disables: [],
      beforeLoad: null,
      loaded: null,
      url: null,
      method: "GET",
      closeDepth: null,
      templates: null,
      animation: true,
      checks: true,
      ...options,
    };

    this.treeNodes = [];
    this.nodesById = {};
    this.leafNodesById = {};
    this.liElementsById = {};
    this.willUpdateNodesById = {};
    this.container = container;
    this.elem = document.querySelector(this.container);
    this.fleetNodeSelected = null;
    this.leafNodeSelected = null;

    if (this.options.url) {
      this.load((data) => {
        this.init(data);
      });
    } else {
      this.init(this.options.data);
    }
  }

  init(data) {
    let {
      treeNodes,
      nodesById,
      leafNodesById,
      defaultValues,
      defaultDisables,
    } = Tree.parseTreeData(data);

    this.treeNodes = treeNodes;
    this.nodesById = nodesById;
    this.leafNodesById = leafNodesById;
    this.render(this.treeNodes);

    const { values, disables, loaded } = this.options;
    if (values && values.length) defaultValues = values;
    defaultValues.length && this.setValues(defaultValues);
    if (disables && disables.length) defaultDisables = disables;
    defaultDisables.length && this.setDisables(defaultDisables);
    loaded && loaded.call(this);
  }

  load(callback) {
    const { url, method, beforeLoad } = this.options;
    fetch(url, {
      method,
    })
      .then((r) => r.json())
      .then((result) => {
        if (beforeLoad) data = beforeLoad(result);
        callback(data);
      })
      .catch((err) => console.error(err));
  }

  render(treeNodes) {
    const treeEle = Tree.createRootEle();
    treeEle.appendChild(this.buildTree(treeNodes, 0));
    this.bindEvent(treeEle);
    if (this.options.checks === false) this.hideChecks();
    empty(this.elem);
    this.elem.appendChild(treeEle);
    this.elem.dispatchEvent(new CustomEvent("tree-rendered"));
  }

  buildTree(nodes, depth) {
    const rootUlEle = Tree.createUlEle();
    if (nodes && nodes.length) {
      nodes.forEach((node) => {
        const liEle = Tree.createLiEle.call(
          this,
          node,
          depth === this.options.closeDepth - 1
        );
        this.liElementsById[node.id] = liEle;
        let ulEle = null;
        ulEle = null;
        if (node.children && node.children.length) {
          ulEle = this.buildTree(node.children, depth + 1);
        }
        ulEle && liEle.appendChild(ulEle);
        rootUlEle.appendChild(liEle);
      });
    }
    return rootUlEle;
  }

  bindEvent(ele) {
    ele.addEventListener("click", this.handleClick.bind(this), false);
  }

  handleClick(e) {
    const { target } = e;
    if (target.nodeName === "SPAN" && (hasClass(target, "tx-checkbox") || hasClass(target, "tx-label"))) {
      e.stopPropagation();
      this.onItemClick(target.parentNode.parentNode.nodeId);
      return;
    }
    
    if (target.nodeName === "SPAN" && hasClass(target, "tx-switcher")) {
      e.stopPropagation();
      this.onSwitcherClick(target);
      return;
    }

    if (!this.options.templates) { 
      return;
    }

    let isFleet = hasClass(target, "tx-folder-ribbon");
    let isLeaf = hasClass(target, "tx-leaf-card");
    let fleetChildren = target.closest(".tx-folder-ribbon");
    let leafChildren = target.closest(".tx-leaf-card");

    if (fleetChildren || isFleet) {  // CLICK FOLDER
      e.stopPropagation();
      let myTarget = isFleet ? target : fleetChildren;
      let selectionFleet = myTarget.closest("li.tx-node");

      updateNodeSelectionStyles(
        myTarget,
        this.container + " .tx-folder-ribbon"
      );
      this.fleetNodeSelected = selectionFleet;

      let selectionLeaf = false;
      if (this.leafNodeSelected && this.fleetNodeSelected.contains(this.leafNodeSelected)) {
        selectionLeaf = this.leafNodeSelected;
      } else {
        updateNodeSelectionStyles(
          null,
          this.container + " .tx-leaf-card"
        );
      }

      this.elem.dispatchEvent(
        new CustomEvent("folder-node-selected", {
          detail: {
            target: e.target, //Array.from(e.target.classList),
            folder: this.cleanData(this.nodesById[selectionFleet.nodeId]),
            leaf: selectionLeaf
              ? this.cleanData(this.leafNodesById[selectionLeaf.nodeId])
              : null,
          },
        })
      );

      return;
    }
    
    if (leafChildren || isLeaf) {  // CLICK LEAF
      e.stopPropagation();
      let myTarget = isLeaf ? target : leafChildren;
      let selectionLeaf = myTarget.closest("li.tx-node");
      let newSelection = myTarget.closest("li.tx-folder");

      let selectionFleet;
      if (this.fleetNodeSelected && newSelection == this.fleetNodeSelected) {
        selectionFleet = this.fleetNodeSelected;
      } else {
        selectionFleet = selectionLeaf.parentElement.parentElement;
        updateNodeSelectionStyles(selectionFleet.querySelector(".tx-folder-ribbon"), this.container + " .tx-folder-ribbon");
        this.fleetNodeSelected = selectionFleet;
      }

      updateNodeSelectionStyles(myTarget, this.container + " .tx-leaf-card");
      this.leafNodeSelected = selectionLeaf;

      this.elem.dispatchEvent(
        new CustomEvent("leaf-node-selected", {
          detail: {
            target: e.target, // Array.from(e.target.classList),
            folder: this.cleanData(this.nodesById[selectionFleet.nodeId]),
            leaf: this.cleanData(this.leafNodesById[selectionLeaf.nodeId]),
          },
        })
      );

      return;
    }
  }

  cleanData(raw) {
    const resp = { ...raw }
    delete resp.children
    delete resp.parent
    return resp
  }

  onItemClick(id) {
    const node = this.nodesById[id];
    const { onChange } = this.options;
    if (!node.disabled) {
      this.setValue(id);
      this.updateLiElements();
    }
    onChange && onChange.call(this);
  }

  //---------

  setValue(id) {
    const node = this.nodesById[id];
    if (!node) return;
    const prevStatus = node.status;
    const status = prevStatus === 1 || prevStatus === 2 ? 0 : 2;
    node.status = status;
    this.markWillUpdateNode(node);
    this.walkUp(node, "status");
    this.walkDown(node, "status");
  }

  getValues() {
    const values = [];
    for (let id in this.leafNodesById) {
      if (this.leafNodesById.hasOwnProperty(id)) {
        if (this.leafNodesById[id].status === 1 || this.leafNodesById[id].status === 2) {
          values.push(id);
        }
      }
    }
    return values;
  }

  setValues(values) {
    this.emptyNodesCheckStatus();
    values.forEach((value) => {
      this.setValue(value);
    });
    this.updateLiElements();
    const { onChange } = this.options;
    onChange && onChange.call(this);
  }

  //---------

  setDisable(id) {
    const node = this.nodesById[id];
    if (!node) return;
    const prevDisabled = node.disabled;
    if (!prevDisabled) {
      node.disabled = true;
      this.markWillUpdateNode(node);
      this.walkUp(node, "disabled");
      this.walkDown(node, "disabled");
    }
  }

  getDisables() {
    const values = [];
    for (let id in this.leafNodesById) {
      if (this.leafNodesById.hasOwnProperty(id)) {
        if (this.leafNodesById[id].disabled) {
          values.push(id);
        }
      }
    }
    return values;
  }

  setDisables(values) {
    this.emptyNodesDisable();
    values.forEach((value) => {
      this.setDisable(value);
    });
    this.updateLiElements();
  }

  //---------

  emptyNodesCheckStatus() {
    this.willUpdateNodesById = this.getSelectedNodesById();
    Object.values(this.willUpdateNodesById).forEach((node) => {
      if (!node.disabled) node.status = 0;
    });
  }

  emptyNodesDisable() {
    this.willUpdateNodesById = this.getDisabledNodesById();
    Object.values(this.willUpdateNodesById).forEach((node) => {
      node.disabled = false;
    });
  }

  getSelectedNodesById() {
    return Object.entries(this.nodesById).reduce((acc, [id, node]) => {
      if (node.status === 1 || node.status === 2) acc[id] = node;
      return acc;
    }, {});
  }

  getDisabledNodesById() {
    return Object.entries(this.nodesById).reduce((acc, [id, node]) => {
      if (node.disabled) acc[id] = node;
      return acc;
    }, {});
  }

  updateLiElements() {
    Object.values(this.willUpdateNodesById).forEach((node) => {
      this.updateLiElement(node);
    });
    this.willUpdateNodesById = {};
  }

  markWillUpdateNode(node) {
    this.willUpdateNodesById[node.id] = node;
  }

  //---------

  onSwitcherClick(target) {
    const liEle = target.parentNode.parentNode;
    const ele = liEle.lastChild;

    if (this.options.animation) {
      const height = ele.scrollHeight;
      if (hasClass(liEle, "tx-node__close")) {
        animation(150, {
          enter() {
            ele.style.height = 0;
            ele.style.opacity = 0;
          },
          active() {
            ele.style.height = `${height}px`;
            ele.style.opacity = 1;
          },
          leave() {
            ele.style.height = "";
            ele.style.opacity = "";
            liEle.classList.replace("tx-node__close", "tx-node__open");
          },
        });
      } else {
        animation(150, {
          enter() {
            ele.style.height = `${height}px`;
            ele.style.opacity = 1;
          },
          active() {
            ele.style.height = 0;
            ele.style.opacity = 0;
          },
          leave() {
            ele.style.height = "";
            ele.style.opacity = "";
            liEle.classList.replace("tx-node__open", "tx-node__close");
          },
        });
      }
    } else {
      if (hasClass(liEle, "tx-node__close")) {
        ele.style.height = "";
        ele.style.opacity = "";
        liEle.classList.replace("tx-node__close", "tx-node__open");
      } else {
        ele.style.height = "";
        ele.style.opacity = "";
        liEle.classList.replace("tx-node__open", "tx-node__close");
      }
    }
  }

  onSwitcherEvent(target, expand) {
    const liEle = target.parentNode.parentNode;
    const ele = liEle.lastChild;
    if (!expand) {
      ele.style.height = "";
      ele.style.opacity = "";
      liEle.classList.replace("tx-node__close", "tx-node__open");
    } else {
      ele.style.height = "";
      ele.style.opacity = "";
      liEle.classList.replace("tx-node__open", "tx-node__close");
    }
  }

  //---------

  walkUp(node, changeState) {
    const { parent } = node;
    if (parent) {
      if (changeState === "status") {
        let pStatus = null;
        const statusCount = parent.children.reduce((acc, child) => {
          if (!isNaN(child.status)) return acc + child.status;
          return acc;
        }, 0);
        if (statusCount) {
          pStatus = statusCount === parent.children.length * 2 ? 2 : 1;
        } else {
          pStatus = 0;
        }
        if (parent.status === pStatus) return;
        parent.status = pStatus;
      } else {
        const pDisabled = parent.children.reduce(
          (acc, child) => acc && child.disabled,
          true
        );
        if (parent.disabled === pDisabled) return;
        parent.disabled = pDisabled;
      }
      this.markWillUpdateNode(parent);
      this.walkUp(parent, changeState);
    }
  }

  walkDown(node, changeState) {
    if (node.children && node.children.length) {
      node.children.forEach((child) => {
        if (changeState === "status" && child.disabled) return;
        child[changeState] = node[changeState];
        this.markWillUpdateNode(child);
        this.walkDown(child, changeState);
      });
    }
  }

  updateLiElement(node) {
    const { classList } = this.liElementsById[node.id];
    switch (node.status) {
      case 0:
        classList.remove("tx-node__halfchecked", "tx-node__checked");
        break;
      case 1:
        classList.remove("tx-node__checked");
        classList.add("tx-node__halfchecked");
        break;
      case 2:
        classList.remove("tx-node__halfchecked");
        classList.add("tx-node__checked");
        break;
    }
    switch (node.disabled) {
      case true:
        if (!classList.contains("tx-node__disabled"))
          classList.add("tx-node__disabled");
        break;
      case false:
        if (classList.contains("tx-node__disabled"))
          classList.remove("tx-node__disabled");
        break;
    }
  }

  toggleChecks() {
    this.elem.classList.toggle("tx-hidden-checkbox");
  }
  hideChecks() {
    this.elem.classList.add("tx-hidden-checkbox");
  }

  collapseAll() {
    let switchers = document.querySelectorAll(
      this.container + " .tx-node__open > .tx-folder-header > .tx-switcher"
    );
    console.log(switchers.length);
    switchers.forEach((sw) => this.onSwitcherEvent(sw, true));
  }

  expandAll() {
    let switchers = document.querySelectorAll(
      this.container + " .tx-node__close> .tx-folder-header > .tx-switcher"
    );
    console.log(switchers.length);
    switchers.forEach((sw) => this.onSwitcherEvent(sw, false));
  }

  filterNodes(e) {
    const q = e.target.value
    console.log(q)
    // if(q.length < 1) return

    // buscar nodes segun q
    const searchedLeaf = contains(this.elem, '.tx-leaf-card > .searchClue', q)
    const nodesLeaf = searchedLeaf.map(el => el.closest('.tx-leaf'))
    const searchedFolder = contains(this.elem, '.tx-folder-ribbon > .searchClue', q)
    const nodesFolder = searchedFolder.map(el => el.closest('.tx-folder'))
    const nodes = [ ...nodesLeaf, ...nodesFolder ]

    // buscar sus nodes hijos
    const allChildren = nodesFolder.reduce((total,n) => [ ...total, ...n.querySelectorAll('.tx-leaf')], [])
    const children = Array.from(new Set(allChildren))

    // buscar sus folders ancestros
    const allFolders = nodes.reduce((total,el) => [ ...total, ...getAncestors(el, '.tx-folder')], [])
    const folders = Array.from(new Set(allFolders))

    // aplicar filtrado del DOM
    this.elem.querySelectorAll('.tx-node').forEach(n => n.classList.add("search-hide"))
    nodes.forEach(n => n.classList.remove("search-hide"))
    children.forEach(n => n.classList.remove("search-hide"))
    folders.forEach(n => n.classList.remove("search-hide"))

  }
  //--------------------------------------------
  get values() {
    return this.getValues();
  }
  set values(values) {
    return this.setValues(uniq(values));
  }

  get disables() {
    return this.getDisables();
  }
  set disables(values) {
    return this.setDisables(uniq(values));
  }

  get selectedNodes() {
    let nodes = [];
    let nodesById = this.nodesById;
    for (let id in nodesById) {
      if (nodesById.hasOwnProperty(id) && (nodesById[id].status === 1 || nodesById[id].status === 2)) {
        const node = { ...nodesById[id] };
        delete node.parent;
        delete node.children;
        nodes.push(node);
      }
    }
    return nodes;
  }

  get disabledNodes() {
    let nodes = [];
    let nodesById = this.nodesById;
    for (let id in nodesById) {
      if (nodesById.hasOwnProperty(id) && nodesById[id].disabled) {
        const node = { ...nodesById[id] };
        delete node.parent;
        nodes.push(node);
      }
    }
    return nodes;
  }
  //--------------------------------------------

  static parseTreeData(data) {
    const treeNodes = deepClone(data);
    const nodesById = {};
    const leafNodesById = {};
    const values = [];
    const disables = [];
    const walkTree = function (nodes, parent) {
      nodes.forEach((node) => {
        nodesById[node.id] = node;
        if (node.checked) values.push(node.id);
        if (node.disabled) disables.push(node.id);
        if (parent) node.parent = parent;
        if (node.children && node.children.length) {
          walkTree(node.children, node);
        } else {
          leafNodesById[node.id] = node;
        }
      });
    };
    walkTree(treeNodes);
    return {
      treeNodes,
      nodesById,
      leafNodesById,
      defaultValues: values,
      defaultDisables: disables,
    };
  }

  static createRootEle() {
    const div = document.createElement("div");
    div.classList.add("tx");
    return div;
  }

  static createUlEle() {
    const ul = document.createElement("ul");
    ul.classList.add("tx-nodes");
    return ul;
  }

  static createLiEle(node, closed) {
    const li = document.createElement("li");
    const header = document.createElement("header");
    li.classList.add("tx-node");
    header.classList.add("tx-header");
    li.classList.add(closed ? "tx-node__close" : "tx-node__open");
    li.classList.add(node.isFleet ? "tx-folder" : "tx-leaf");

    if (node.isFleet) {
      const switcher = document.createElement("span");
      switcher.classList.add(node.children && node.children.length ? "tx-switcher" : "tx-void");
      header.appendChild(switcher);
    }

    /*const divCheck = document.createElement('div');
    divCheck.classList.add('tx-div-checkbox');
    const checkbox = document.createElement('span');
    checkbox.classList.add('tx-checkbox');
    divCheck.appendChild(checkbox);
    header.appendChild(divCheck);*/

    const checkbox = document.createElement("span");
    checkbox.classList.add("tx-checkbox");
    header.appendChild(checkbox);

    if (this.options.templates && "template" in node) {
      const div = document.createElement("div");
      node.className && div.classList.add(node.className);
      div.innerHTML = this.options.templates[node.template](node);
      div.classList.add(node.isFleet ? "tx-folder-ribbon" : "tx-leaf-card");
      header.classList.add(node.isFleet ? "tx-folder-header" : "tx-leaf-header");
      header.appendChild(div);
    } else {
      header.classList.add(node.isFleet ? "tx-folder-header" : "tx-leaf-header");
      const label = document.createElement("span");
      label.classList.add("tx-label");
      const text = document.createTextNode(node.text);
      label.appendChild(text);
      header.appendChild(label);
    }

    li.appendChild(header);
    li.nodeId = node.id;
    return li;
  }
}

function hasClass(target, className) {
  return target.classList.contains(className);
}

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function uniq(arr) {
  const map = {};
  return arr.reduce((acc, item) => {
    if (!map[item]) {
      map[item] = true;
      acc.push(item);
    }
    return acc;
  }, []);
}

function empty(ele) {
  while (ele.firstChild) {
    ele.removeChild(ele.firstChild);
  }
}

function animation(duration, callback) {
  requestAnimationFrame(() => {
    callback.enter();
    requestAnimationFrame(() => {
      callback.active();
      setTimeout(() => {
        callback.leave();
      }, duration);
    });
  });
}

function updateNodeSelectionStyles(myTarget, selector) {
  let prevSelection = document.querySelector(selector + ".selected");

  if (prevSelection) {
    prevSelection.classList.remove("selected");
    let node = prevSelection.closest("li.tx-node");
    let head = prevSelection.closest(".tx-header");
    node && node.classList.remove("selected");
    head && head.classList.remove("selected");
  }

  if (myTarget) {
    myTarget.classList.add("selected");
    let node = myTarget.closest("li.tx-node");
    let head = myTarget.closest(".tx-header");
    node && node.classList.add("selected");
    head && head.classList.add("selected");
  }
}

function contains(baseElem, selector, q) {
  var elements = baseElem.querySelectorAll(selector)
  return Array.prototype.filter.call(elements, function(element){
    let r = RegExp(q, "gi").test(element.textContent)
    return r
  });
}

function getAncestors(element, selector) {
  const ancestors = [];
  let currentElement = element;
  while (currentElement) {
    currentElement = currentElement.closest(selector);
    if (currentElement) {
      ancestors.push(currentElement);
      currentElement = currentElement.parentElement;
    }
  }
  return ancestors;
}
