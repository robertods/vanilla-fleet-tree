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
  
  TwinDimensionTree.generate(
    self.ctx.datasources[0],
    self.ctx.settings, 
    mappers,
    this.ctx.actionsApi
  );
  
  self.onResize();
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