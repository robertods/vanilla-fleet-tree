```html
<iframe src="http://localhost:5500" id="external-app-widget"></iframe>
```

```css
#container {
    overflow: auto;
}

#external-app-widget {
  border: none;
  width: 100%;
  height: 100%;
  display: block;
}
```

```js
self.onInit = function() {

  ///////////////////
  const EXTERNAL_WIDGET_URL = "http://localhost:5500"
  self.ctx.myFrame = document.getElementById("external-app-widget").contentWindow;
    
  window.addEventListener('message', function(e) {
    if(e.origin !== EXTERNAL_WIDGET_URL) return;
    const data = JSON.parse(e.data)
    
    if(data.target.includes("fa-info-circle")){
      console.log("info > ", data)
      return 
    }
    console.log("widget >", data)
  })
  ///////////////////
  
  setTimeout(()=>{
      const refresh_token = window.localStorage.getItem("refresh_token")
      self.ctx.myFrame.postMessage(JSON.stringify({ type: 'INIT', value: refresh_token}), "*");
  }, 3000)

  self.onResize();
}
self.onDataUpdated = function() {
}

self.onResize = function() {
}

self.onDestroy = function() {
}
```