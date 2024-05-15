let FleetTree1;
//const API = 'https://api.twindimension.com/tdata/v1'
const API = 'https://tdata.tesacom.net/api'

document.getElementById("btnVisibles").addEventListener("click", e => FleetTree1.toggleChecks() );
document.getElementById("btnColapsar").addEventListener("click", e => FleetTree1.collapseAll() );
document.getElementById("btnExpandir").addEventListener("click", e => FleetTree1.expandAll() );
document.getElementById("fleet-list-tree").innerHTML = '<h1 style="color: rgb(0, 183, 255);text-align:center;"><i class="fa fa-spinner fa-spin"></i> Cargando</h1>';

/*const treeData = {
  "fleets":[
    {"id":"1","name":"Organizacion x","parent":null},
    {"id":"4","name":"Outside","parent":null},
    {"id":"2","name":"Ferry","parent":"1"},
    {"id":"3","name":"Main","parent":"2"},
  ],
  "devices":[
    {"id_vehiculo":"5948","name":"0-3366012","parent":"1","patente":"0-3366012","model":"MACHINE","icon":"tren.png"},
    {"id_vehiculo":"5949","name":"0-3366019","parent":"2","patente":"0-3366019","model":"MACHINE","icon":"tren.png"},
    {"id_vehiculo":"5950","name":"0-3366045","parent":"3","patente":"0-3366045","model":"MACHINE","icon":"tren.png"},
    {"id_vehiculo":"5951","name":"0-3366053","parent":"4","patente":"0-3366053","model":"MACHINE","icon":"tren.png"},
  ]
}*/

(async () => {
  const treeData = await appo()
  generateTree(treeData);
})()


//------------------------------------

function generateTree(raw) {
    
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
    let obj;
    obj = { ...r };
    obj.id = r.id;
    obj.text = r.name;
    obj.className = 'custom-fleet';
    obj.isFleet = true;
    obj.template = 'FLEET';
    
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
    let obj;
    obj = {...r};
    obj.id = r.id_vehiculo;
    obj.text = r.name;
    obj.className = 'custom-card';
    obj.template = r.model || 'basico';
    
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
  
  FleetTree1 = new Tree('#fleet-list-tree', {
    animation: false,
    checks: false,
    templates: {
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
    },
    data: tree, // tree data
    values: [tree[0].id],
  });

  document.getElementById("fleet-list-tree").addEventListener("folder-node-selected", e => sendMessage({ event: "folder-node-selected", ...e.detail}));
  document.getElementById("fleet-list-tree").addEventListener("leaf-node-selected", e => sendMessage({ event: "leaf-node-selected", ...e.detail}));
  document.getElementById("fleet-list-tree").addEventListener("tree-rendered", e => sendMessage({ event: "tree-rendered", ...e.detail}));
}



//------------------------------------
 
window.addEventListener('message', async e => {

  //console.log("recibiendo de: ", e.origin)
  if(e.origin !== "https://tdata.tesacom.net") {
    return
  }
  
  const data = JSON.parse(e.data)
  console.log("DATA: ", data)
  const REFRESH_TOKEN = 'eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJkZXZ0ZW5hbnRkZW1vQG1haWwuY29tIiwidXNlcklkIjoiOGM5YjhiOTAtZjYzZi0xMWVkLWI4MzEtZGJiZWQ4ZjQyZjIyIiwic2NvcGVzIjpbIlRFTkFOVF9BRE1JTiJdLCJzZXNzaW9uSWQiOiJjNWRkNDIzYi1hMWViLTRiMDQtYjcwYy00ZWE4MGVhM2Y2MDYiLCJpc3MiOiJ0aGluZ3Nib2FyZC5pbyIsImlhdCI6MTcxNTM2NzkwNywiZXhwIjoxNzE1Mzc2OTA3LCJmaXJzdE5hbWUiOiJUZW5hbnQiLCJsYXN0TmFtZSI6IkRlbW8iLCJlbmFibGVkIjp0cnVlLCJpc1B1YmxpYyI6ZmFsc2UsInRlbmFudElkIjoiN2NhOWQxYjAtZjYzZi0xMWVkLWI4MzEtZGJiZWQ4ZjQyZjIyIiwiY3VzdG9tZXJJZCI6IjEzODE0MDAwLTFkZDItMTFiMi04MDgwLTgwODA4MDgwODA4MCJ9.MiP9o1XS3bAZMaq8RnWzlP3upE2aMVKkVaRqTTUUofG3CDYhnH2Noo_IvZz6OKGAFBrSa_lM8vk9NVvTxw9LoA' // data.value
  
  if(data.type === 'INIT'){
    const r = await fetch(API+'/auth/token', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ "refreshToken": REFRESH_TOKEN })
    })
    const { token: ACCESS_TOKEN } = await r.json()
    const { data: rawNodes } = await fetch(API+'/relations/info', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json', 'X-Authorization': 'Bearer ' + ACCESS_TOKEN }, 
      body: JSON.stringify({
        "parameters": {
          "rootId": "509deba0-f8b1-11ed-b831-dbbed8f42f22",
          "rootType": "ASSET",
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
    //const { data: rawDevices } = await fetchPages(API+'/tenant/devices?pageSize=50&page=0', ACCESS_TOKEN)
    //const { data: rawAssets } = await fetchPages(API+'/tenant/assets?pageSize=50&page=0', ACCESS_TOKEN)
    
    const devices = rawDevices.map(d => ({
      id: d.id.id,
      type: d.deviceProfileId.id,
      name: d.label || d.name,
      identifier: d.name,
      "model":"MACHINE_TD",
      "icon":"tren.png",
      "parent":"1",
    }))
    const fleets = rawAssets.map(a => ({
      id: a.id.id,
      name: a.label || a.name,
      ...a
    }))
    const tree = {
      fleets,
      devices
    }
    console.log(tree)
  }

})

async function fetchPages(url, jwt) {
  const r = await fetch(url, { headers: { 'X-Authorization': 'Bearer ' + jwt } })
  const devices = await r.json()
  return devices
}

function sendMessage(data) {
  const widgetData = JSON.stringify(data)
  window.parent.postMessage(widgetData, '*')
}

async function appo() {
  const ACCESS_TOKEN = window.localStorage.getItem('jwt_token')
    const r = await fetch(API+'/relations/info', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json', 'X-Authorization': 'Bearer ' + ACCESS_TOKEN }, 
      body: JSON.stringify({
        "parameters": {
          "rootId": "509deba0-f8b1-11ed-b831-dbbed8f42f22",
          "rootType": "ASSET",
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
    console.log(tree)
    return tree
  
}