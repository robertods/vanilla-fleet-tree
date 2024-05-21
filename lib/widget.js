/*
// USE EXAMPLE

const mappers = {
  "asset": a => ({ id: a.id, text: a.name, template: 'FLEET'  }),
  "device": d => ({ id: d.name, text: d.name, template: 'MACHINE' })
}

const templates = {
  BASIC: (node) => `
    <div class="searchClue">${node.text.toLowerCase()} ${node.id.toLowerCase()}</div>
    <div class="data">
      <b>${node.id}</b>
      <p style="background:#EEE;">${node.text}</p>
      <b>Último reporte: </b><span>--</span>
    </div>
  `,
  MACHINE: (node) => `
    <div class="searchClue">${node.text.toLowerCase()} ${node.id.toLowerCase()}</div>
    <div class="circle"><i class="fa fa-car"></i></div>
    <div class="data">
      <p><b>${node.id}</b></p>
      <p class="badge">${node.text}</p>
      <p>Último reporte: <span>--</span></p>
      <p>Último horómetro <span>--</span></p>
    </div>
    <div><i class="fa fa-2x fa-info-circle"></i></div>
  `,
  FLEET: node => `
    <span>${node.text}</span>
  `,
}

const actions = {
  "folder-node-selected": e => console.log("folder-node-selected", e.detail),
  "leaf-node-selected": e => console.log("leaf-node-selected", e.detail),
  "tree-rendered": e => console.log("tree-rendered", e.detail),
}

const raw = getDataTree(nodoRoot)

generateTree(raw, mappers, templates, actions)

*/

async function getApiData(node){
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
 
function generateTree(raw, mappers, templates, actions) {
  
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
      "FLEET": node => `<span>${node.text}</span>`,
      ...templates 
    },
    data: tree, // tree data
    values: [tree[0].id],
  });

  document.getElementById("btnVisibles").addEventListener("click", e => FleetTree1.toggleChecks() );
  document.getElementById("btnColapsar").addEventListener("click", e => FleetTree1.collapseAll() );
  document.getElementById("btnExpandir").addEventListener("click", e => FleetTree1.expandAll() );
  document.getElementById("txtSearchList").addEventListener("input", e => FleetTree1.filterNodes(e));
  
  document.getElementById("fleet-list-tree").addEventListener("folder-node-selected", actions["folder-node-selected"]);
  document.getElementById("fleet-list-tree").addEventListener("leaf-node-selected", actions["leaf-node-selected"]);
  document.getElementById("fleet-list-tree").addEventListener("tree-rendered", actions["tree-rendered"]);
}


// e => console.log({ event: "folder-node-selected", ...e.detail})
/*
  console.log("self.ctx", self.ctx)
  
  const settings = self.ctx.settings;
  const widgetConfig = self.ctx.widgetConfig;
  const subscription = self.ctx.defaultSubscription;
  const datasources = self.ctx.datasources;
  
  console.log(settings)
  console.log(widgetConfig)
  console.log(subscription)
  console.log(datasources)
  */
 
  /*


  // obtener este filtro dinamicamente
  const childrenDatasource = {
      dataKeys: datasource.dataKeys,
      type: 'entity',
      filterId: datasource.filterId,
      entityFilter: {
        rootEntity: {
          id: datasource.entityId,
          entityType: datasource.entityType
        },
        direction: 'FROM',
        maxLevel: 10,
        type: 'relationsQuery',
        filters: [{
          relationType: "Contains",
          entityTypes: ["ASSET","DEVICE"]
        }]
      }
  }

  // obtener las funciones dinamicamente de la configuracion del widget
  self.ctx.subscriptionApi.createSubscription({
      type: 'latest',
      datasources: [childrenDatasource],
      callbacks: {
        onSubscriptionMessage: (subscription, message) => {
          console.log("message: ", message);
        },
        onInitialPageDataChanged: (subscription) => {
          console.log("initial: ", subscription);
        },
        onDataUpdated: subscription => {
          console.log("updated: ", subscription)
          generateTree(subscription.data)
        }
      }
    }, true)

    */