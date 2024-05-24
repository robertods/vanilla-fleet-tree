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
    <div class="searchClue">${node.text.toLowerCase()}</div>
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
   



//------------------------------------
/* 
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
*/