```html
<div class="containerTree">
    <section id="fleet-list" class="tab-content selected list">
      <header>
        <input type="text" id="txtSearchList">
      </header>
      <section id="fleet-list-tree"></section>
      <footer>
        <button id="btnColapsar"><i class="fa fa-caret-right"></i> All</button>
        <button id="btnExpandir"><i class="fa fa-caret-down"></i> All</button>
        <button id="btnVisibles"><i class="fa fa-eye"></i></button>
      </footer>
    </section>
</div>
```

```css
#container {
    overflow: auto;
}
```

```js
self.onInit = function() {

  console.log("self.ctx", self.ctx)
  
  const settings = self.ctx.settings;
  const widgetConfig = self.ctx.widgetConfig;
  const subscription = self.ctx.defaultSubscription;
  const datasources = self.ctx.datasources;
  
  console.log(settings)
  console.log(widgetConfig)
  console.log(subscription)
  console.log(datasources)
  
  
  //-----------------
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
  "devices":[
    {"id_vehiculo":"5948","name":"0-3366012","parent":"1","patente":"0-3366012","model":"MACHINE","icon":"tren.png"},
    {"id_vehiculo":"5949","name":"0-3366019","parent":"2","patente":"0-3366019","model":"MACHINE","icon":"tren.png"},
    {"id_vehiculo":"5950","name":"0-3366045","parent":"3","patente":"0-3366045","model":"MACHINE","icon":"tren.png"},
    {"id_vehiculo":"5951","name":"0-3366053","parent":"4","patente":"0-3366053","model":"MACHINE","icon":"tren.png"},
  ]
}

generateTree(treeData);
  ///////////////////
  /*const EXTERNAL_WIDGET_URL = "http://localhost:5500"
  self.ctx.myFrame = document.getElementById("external-app-widget").contentWindow;
    
  window.addEventListener('message', function(e) {
    if(e.origin !== EXTERNAL_WIDGET_URL) return;
    const data = JSON.parse(e.data)
    
    if(data.target.includes("fa-info-circle")){
      console.log("info > ", data)
      return 
    }
    console.log("widget >", data)
  })*/
  ///////////////////
  
  setTimeout(()=>{
      const refresh_token = window.localStorage.getItem("refresh_token")
      self.ctx.myFrame.postMessage(JSON.stringify({ type: 'INIT', value: refresh_token}), "*");
  }, 3000)

  self.onResize();
  
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

  document.getElementById("fleet-list-tree").addEventListener("folder-node-selected", e => console.log({ event: "folder-node-selected", ...e.detail}));
  document.getElementById("fleet-list-tree").addEventListener("leaf-node-selected", e => console.log({ event: "leaf-node-selected", ...e.detail}));
  document.getElementById("fleet-list-tree").addEventListener("tree-rendered", e => console.log({ event: "tree-rendered", ...e.detail}));
}
}
self.onDataUpdated = function() {
}

self.onResize = function() {
}

self.onDestroy = function() {
}
```