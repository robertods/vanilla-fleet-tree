# vanilla-fleet-tree

## Resources:
- https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css
- https://resources.twindimension.com/lib/tree.css
- https://resources.twindimension.com/lib/widget.css
- https://resources.twindimension.com/lib/tree.js
- https://resources.twindimension.com/lib/widget.js

## HTML:
```html
<section class="widgetContainer">
  <header>
    <input type="search" id="txtSearchList">
  </header>
  <section id="fleet-list-tree"></section>
  <footer>
    <button id="btnCollapse"><i class="fa fa-caret-right"></i> All</button>
    <button id="btnExpand"><i class="fa fa-caret-down"></i> All</button>
    <button id="btnVisibility"><i class="fa fa-eye"></i></button>
  </footer>
</section>
```

## CSS:
```css
#container {
  overflow: auto;
}
```

## JAVASCRIPT:
```js
self.onInit = function() {
  
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
      <div classs="searchClue">${node.text.toLowerCase()}</div>
      <span>${node.text}</span>
    `,
  }
  
  const actions = {
    "folder-node-selected": e => {
      console.log("folder-node-selected")
      const descriptors = this.ctx.actionsApi.getActionDescriptors('folderNodeSelected');
      if (descriptors.length) {
        this.ctx.actionsApi.handleWidgetAction(e, descriptors[0], e.detail.folder.id, e.detail.folder.text)
      }
    },
    "leaf-node-selected": e => {
      console.log("leaf-node-selected")
      const descriptors = this.ctx.actionsApi.getActionDescriptors('leafNodeSelected');
      if (descriptors.length) {
        this.ctx.actionsApi.handleWidgetAction(e, descriptors[0], e.detail.leaf.id, e.detail.folder.text)
      }
    }
  }

  let datasource = self.ctx.datasources[0];
  const treeData = await TwinDimensionTree.getData(datasource);
  TwinDimensionTree.generate(treeData, mappers, templates, actions);  
}

self.onDataUpdated = function() {
}

self.actionSources = function() {
  return {
    'folderNodeSelected': {
      name: 'widget-action.folder-node-selected',
      multiple: false
    },
    'leafNodeSelected': {
      name: 'widget-action.leaf-node-selected',
      multiple: false
    }
  }
}

self.onResize = function() {
}

self.onDestroy = function() {
}
```