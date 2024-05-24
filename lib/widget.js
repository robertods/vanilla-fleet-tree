class TwinDimensionTree {
  static async getData(node){

    const API = 'https://tdata.tesacom.net/api'
    const ACCESS_TOKEN = window.localStorage.getItem('jwt_token')
      const r = await fetch(API+'/relations/info', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json', 'X-Authorization': 'Bearer ' + ACCESS_TOKEN }, 
        body: JSON.stringify({
          "parameters": {
            "rootId": node.entityId, // "509deba0-f8b1-11ed-b831-dbbed8f42f22",
            "rootType": node.entityType, // "ASSET",
            "direction": "FROM",
            "relationTypeGroup": "COMMON",
            "maxLevel": 10,
            "fetchLastLevelOnly": false
          },
          "filters": [{
            "relationType": "Contains",
            "entityTypes": [ "ASSET", "DEVICE" ]
          }]
        })
      })
    
    const rawNodes = await r.json()
    const all = rawNodes.map(a => ({ id: a.to.id, name: a.toName, type: a.to.entityType, parent: a.from.id }))
    const fleets = all.filter(a => a.type === 'ASSET').map(a => ({ ...a, model: "FLEET" })).sort((a, b) => a.parent.localeCompare(b.parent))
    const devices = all.filter(a => a.type === 'DEVICE').map(a => ({ ...a, model: "MACHINE", icon: "tren.png", identifier: a.name })).sort((a, b) => a.parent.localeCompare(b.parent))

    const tree = {
      fleets,
      devices
    }

    return tree
  }
  
  static async generate(datasource, settings, mappers, actionsApi) {
    
    const raw = await TwinDimensionTree.getData(datasource)
    const templates = settings.templates.reduce((a,t) => ({ ...a, [t.name]: new Function('node', t.function) }), {})
    const actions = {
      "folder-node-selected": e => {
        console.log("folder-node-selected")
        const descriptors = actionsApi.getActionDescriptors('folderNodeSelected');
        if (descriptors.length) {
          actionsApi.handleWidgetAction(e, descriptors[0], e.detail.folder.id, e.detail.folder.text)
        }
      },
      "leaf-node-selected": e => {
        console.log("leaf-node-selected")
        const descriptors = actionsApi.getActionDescriptors('leafNodeSelected');
        if (descriptors.length) {
          actionsApi.handleWidgetAction(e, descriptors[0], e.detail.leaf.id, e.detail.folder.text)
        }
      }
    }

    let base = "flt-";
    let tree = [{
      id: 'root',
      text: 'Fleet root',
      children: [],
      className: 'custom-fleet',
      isFleet: true,
      template: 'FLEET'
    }];

    let myFleets = {
      [base + 'root']: tree[0]
    };

    raw.fleets.forEach(r => {
      let obj = { 
        className: 'custom-fleet',
        isFleet: true,
        ...mappers.asset(r)
      };
      
      let parentId = base + r.parent;
      myFleets[base + obj.id] = obj;
      if(parentId in myFleets){
        if("children" in myFleets[parentId] == false){
          myFleets[parentId].children = [];
        }
        myFleets[parentId].children.push(obj);
      } else {
        tree[0].children.push(obj);
      }
    });

    raw.devices.forEach(r => {
      let obj = { 
        className: 'custom-card',
        isFleet: false,
        ...mappers.device(r)
      };
      
      let parentId = base + r.parent;
      if(parentId in myFleets){
        if("children" in myFleets[parentId] == false){
          myFleets[parentId].children = [];
        }
        myFleets[parentId].children.push(obj);
      } else {
        tree[0].children.push(obj);
      }
    });
    
    if(tree[0].children.length === 1){
      tree = [ tree[0].children[0] ];
      delete tree[0].parent;
    }

    document.getElementById("fleet-list-tree").innerHTML = '<h1 style="color: rgb(0, 183, 255);text-align:center;"><i class="fa fa-spinner fa-spin"></i> Cargando</h1>';

    let FleetTree1 = new Tree('#fleet-list-tree', {
      animation: false,
      checks: false,
      templates: { 
        "FLEET": node => `<div class="search-clue">${node.text.toLowerCase()}</div><span>${node.text}</span>`,
        ...templates 
      },
      data: tree, // tree data
      values: [tree[0].id],
    });

    document.getElementById("btnVisibility").addEventListener("click", e => FleetTree1.toggleChecks() );
    document.getElementById("btnCollapse").addEventListener("click", e => FleetTree1.collapseAll() );
    document.getElementById("btnExpand").addEventListener("click", e => FleetTree1.expandAll() );
    document.getElementById("txtSearchList").addEventListener("input", e => FleetTree1.filterNodes(e));
    
    document.getElementById("fleet-list-tree").addEventListener("folder-node-selected", actions["folder-node-selected"]);
    document.getElementById("fleet-list-tree").addEventListener("leaf-node-selected", actions["leaf-node-selected"]);
    document.getElementById("fleet-list-tree").addEventListener("tree-rendered", actions["tree-rendered"]);
  }
}