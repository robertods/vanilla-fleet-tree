let FleetTree1;

document.getElementById("btnVisibles").addEventListener("click", e => FleetTree1.toggleChecks() );
document.getElementById("btnColapsar").addEventListener("click", e => FleetTree1.collapseAll() );
document.getElementById("btnExpandir").addEventListener("click", e => FleetTree1.expandAll() );
document.getElementById("fleet-list-tree").innerHTML = '<h1 style="color: rgb(0, 183, 255);text-align:center;"><i class="fa fa-spinner fa-spin"></i> Cargando</h1>';

const treeData = {
  "fleets":[
    {"id":"1","name":"Organizacion x","parent":null},
    {"id":"4","name":"Outside","parent":null},
    {"id":"2","name":"Ferry","parent":"1"},
    {"id":"3","name":"Main","parent":"2"},
  ],
  "assets":[
    {"id_vehiculo":"5948","name":"0-3366012","parent":"1","patente":"0-3366012","model":"MACHINE","icon":"tren.png"},
    {"id_vehiculo":"5949","name":"0-3366019","parent":"2","patente":"0-3366019","model":"MACHINE","icon":"tren.png"},
    {"id_vehiculo":"5950","name":"0-3366045","parent":"3","patente":"0-3366045","model":"MACHINE","icon":"tren.png"},
    {"id_vehiculo":"5951","name":"0-3366053","parent":"4","patente":"0-3366053","model":"MACHINE","icon":"tren.png"},
  ]
}

generateTree(treeData);

//------------------------------------
function sendMessage(data) {
  const widgetData = JSON.stringify(data)
  window.parent.postMessage(widgetData, '*')
}

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

  raw.assets.forEach(r => {
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

  document.getElementById("fleet-list-tree").addEventListener("fleet-node-selected", e => {
    console.log(e.detail)
  });
  document.getElementById("fleet-list-tree").addEventListener("leaf-node-selected", e => {
    if(e.detail.target.classList.contains("fa-info-circle")){
      console.log("open info for ", e.detail)
      return 
    }
    console.log(e.detail)
  });
  //document.getElementById("fleet-list-tree").addEventListener("fleet-rendered", e =>  {
    //polling();
    //updateControl = setTimeout(polling, 60000);
  //});
}

//------------------------------------
const API = 'https://api.twindimension.com/tdata/v1'
 
window.addEventListener('message', async e => {

  //console.log("recibiendo de: ", e.origin)
  if(e.origin !== "https://tdata.tesacom.net") {
    return
  }
  debugger;
  const data = JSON.parse(e.data)
  console.log("DATA: ", data)
  const REFRESH_TOKEN = data.value
  
  if(data.type === 'INIT'){
    const r = await fetch(API+'/token', { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken: REFRESH_TOKEN })})
    const ACCESS_TOKEN = await r.json()
    const devices = await fetchPages(API+'/devices?pageSize=50&page=0', ACCESS_TOKEN)
    console.log(devices)
  }

})

async function fetchPages(url, jwt) {
  const r = await fetch(url, { headers: { 'X-Authorization': 'Bearer ' + jwt } })
  const devices = await r.json()
  return devices
}