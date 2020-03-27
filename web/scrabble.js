
Host = (function(){

    var host = Vue.component('host', { 
    data:     ()=> { return { foo: 0 }},
    template: `
        <div>host {{$route.params}}</div>
    `
    })













      return host;
})


