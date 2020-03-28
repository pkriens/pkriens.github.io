
const SETXY = 1;



class Sprite {

    constructor(x, y, w, h, cls, images, container) {
        this.id = -1;
        this.state = 0;
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.cls = cls;
        this.images = images;
        this.container = container ? true : false;
    }

    update(sel) {}

    move(x, y,state,owner) {
        this.x = x
        this.y = y
        this.state = state;
        this.owner = owner;
    }

    posx() {
        return this.x - this.w / 2;
    }

    posy() {
        return this.y - this.h / 2;
    }

    get right() {
        return this.x + this.w / 2
    }
    get left() {
        return this.x - this.w / 2
    }
    get top() {
        return this.y - this.h / 2
    }
    get bottom() {
        return this.y + this.h / 2
    }

    overlap(other) {
        if(this.left > other.right)
            return false;

        if(this.right < other.left)
            return false;

        if (this.top > other.bottom)
            return false;

        if (this.bottom < other.top)
            return false;

        return true;
    }

}

class Scene {
    

    constructor(id) {
        this.element = d3.select(id);
        this.n = 0;
        this.users = {}
        this.sprites = []
        this.owner = null;
        this.action = null;
        this.stream = navigator.mediaDevices.getUserMedia( { 
            video: { width: { max: 100}}, 
            audio: true });
        this.stream.then( stream => console.log("local stream ok")).catch( err=> console.log("local stream err", err));
    }

    setAction(action) {
        this.action = action;
    }

    setOwner(id) {
        this.owner=id;
    }

    add(sprite) {
        sprite.id = this.n++;
        sprite.scene = this;
        this.sprites.push(sprite);
    }

    update() {
        var THIS = this;
        var ox, oy;
        var sx, sy, contained = [], THIS = this;

        let sel = this.element.selectAll("image").data(this.sprites);

        sel.enter()
            .append("image")
            .classed("sprite", true)
            .on("dblclick",(d) => { 
                var state = (d.state + 1) % 2;
                this.action.move(d.id,d.x,d.y,state,d.owner);
             })
             .filter( d=> !d.container )
            .attr("width", (s)=>s.w)
            .attr("height", (s)=>s.h)
            .call(d3.drag().on("start", dragstarted).on("drag", dragged).on("end", dragended));

        function dragstarted(d) {
            ox=d.x;
            oy=d.y;
            let s = d3.select(this);
            s.raise();
            sx = d3.event.x;
            sy = d3.event.y;
        }

        function dragged(d) {
            var dx = d3.event.x - sx
              , dy = d3.event.y - sy;
            sx = d3.event.x;
            sy = d3.event.y;

            var owner = null;
            if ( THIS.owner && d.y+dy > 1000)
                owner = THIS.owner;

            d.x += dx;
            d.y += dy;
            THIS.update();
//            contained.forEach(c=> THIS.action.move(c.id, c.x+dx, c.y+dy, c.state, null))
        }

        function dragended(d) {
            if ( d.x != ox && d.y != oy)
                THIS.action.move(d.id,d.x,d.y,d.state,d.owner);
        }

        sel = this
            .element
            .selectAll("image")
                .data(this.sprites)
                .attr("href", (s)=>s.images[s.state])
                .classed("hide", (s)=> {
                    var t = s.owner != null && s.owner != this.owner;
                    return t;
                })
                .attr("x", (s)=>s.posx())
                .attr("y", (s)=>s.posy())

        var users = d3.select("#users")
            .selectAll(".user")
            .data(Object.values(this.users), (d)=>d.id);

        var user = users
            .enter()
                .append("div")
                .classed("user", (d)=> {
                    console.log(d);
                    return true;
                });

        user.append("div")
            .text( d=> { 
                return d.name; 
            });

        user.append("video")
             .attr("id", (d)=>"v-"+d.id)
             .attr("controls", true)
             .attr("autoplay", true)

//         user.append("audio")
//              .attr("id", (d)=>"a-"+d.id);


//         users.selectAll("video").attr( "srcObject", (d)=> {
//             console.log("setting stream",d);
//                 return d.stream;
//         });
//         users.selectAll("audio").attr( "srcObject", (d)=> {
//             console.log("setting stream",d);
//                 return d.stream;
//         });

        var exit = users
            .exit()
                .remove()
    }

    exec( events) {
        events.forEach( e => this.event( e.fun, e.args));
        this.update();
    }    

    event(fun,args) {
        switch(fun) {
            case "init":
                this.users=[];
                break;

            case "move":
                var sprite = this.find([args[0]]);
                sprite.move(  args[1], args[2], args[3], args[4]);
                break;

            case "user":
                var userId = args[0];
                var user = this.users[userId];
                if( !user) {
                    this.users[userId] = new User(this,userId,args[1]);
                }
                break;

            case "owner":
                var userId = args[0];
                var userName = args[1];
                var user = this.users[userId];
                if( !user) {
                    this.users[userId] = new User(this,userId,userName);
                    this.owner = userId;
                }
                break;

            case "gone":
                var userId = args[0];
                var user = this.users[userId];
                if( user) {
                    delete this.users[userId];
                }
                break;


            default:
                console.log("Huh?",fun);
                break;
        }
    }
    
    find (id) {
        for ( var sprite of this.sprites) {
            if ( sprite.id == id)
                return sprite;
        }
        return null;
    }

    /**
     * This is only on the server. Create a set of events that will sync
     * the state of this scenes data.
     */

    initial(remoteId,name) {
        var events = []

        this.users[remoteId]=new User(this,remoteId,name);
        this.update();
        events.push( { fun: "init", args:[]});          
        Object.values(this.users).forEach( user => events.push({ fun: "user", args: [user.id, user.name]}));

        this.sprites.forEach( sprite => {
           events.push( { fun: "move", args: [sprite.id,sprite.x,sprite.y,sprite.state,sprite.owner]} ) 
        });

        return events;
    }

}

class User {
    constructor(scene,id,name) {
        this.id = id;
        this.name = name;
        this.scene=scene;
        this.stream = null;
        this.scene.action.call(id, s=>this.setStream(s));
    }

    setStream(stream) {
        this.stream=stream;
        var n = document.getElementById( "v-"+this.id);
        n.srcObject=stream;
    }
}

function zoomed() {
    g.attr("transform", d3.event.transform);
}
