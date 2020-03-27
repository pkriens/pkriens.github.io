

class Sync {
    
    constructor(scene,cb) {
      this.scene = scene;
      this.ics = [];
      this.oc = null;
      this.options = {
        debug:  0,
        host: "15.236.70.217",
        port: 9001,
        path: "/myapp",
        key: "peerjs",
        secure: false
         ,
         config: {'iceServers': [
              { url: 'turn:15.236.70.217:3478', username: "aQute", credential: "turn6754"},
              { url: 'stun:15.236.70.217:3478' , username: "aQute", credential: "turn6754"}
         ]} 
      };
      this.events = []
      this.peer = new Peer(this.options);
        this.peer.on('open', id => {
            console.log(':open',id);
            this.scene.setOwner(id);
            if ( cb )
                cb(id);
        });
        this.peer.on('error', err => {
            console.log(':error', err);
        });
        this.peer.on('disconnected', err => {
            console.log('slave:disconnect', err, " reconnecting");
            this.peer.reconnect();
        });
    }

    slave(masterId,name) {
        this.peer.on('call', (call) => {
            console.log("slave:incoming call", call,"fetch local stream");
            this.scene.stream.then( local => {
              console.log("slave:local stream found", local,"answer to caller");
              call.answer(local);

              call.on('stream', stream => {
                  console.log("slave:receive master stream", stream);
                  this.scene.users[call.peer].setStream(stream);
                  this.scene.update();
              });
            });
        });

        this.connect(masterId,name);
    }

    connect(id, name) {
        var oc = this.peer.connect(id, { metadata: { name: name }});

        console.log("slave:connect to master",id );

        oc.on('open', () => {
            console.log("slave:open", oc );
            this.oc = oc;
        });

        oc.on('data', masterData => {
            scene.exec(masterData);
        });

        oc.on('close', () => {
            console.log('slave:close retry');
            setTimeout(()=>this.connect(id),100);
            this.oc = null;
        });

        oc.on('error', () => {
            console.log('slave:error retry');
            setTimeout(()=>this.connect(id),100);
            this.oc = null;
        });

       
    }

    // master mode

    master(name) {
        this.user(this.peer.id,name)
        this.peer.on('connection', ic => {
            console.log("master:ic:connection",ic.peer);

            ic.on('open', (x) => {
                console.log('master:ic:open',ic.peer);
                ic.send( scene.initial(ic.peer, ic.metadata.name) );
                this.ics.push(ic);
            });

            ic.on( 'data', data=> {
                console.log('master:ic:data',ic.peer);
                this.scene.exec(data);
                this.ics.filter( x => x!=ic).forEach( x => x.send(data));
            });

            ic.on('close', (x) => {
                console.log('master:ic:close',ic.peer);
                this.ics = this.ics.filter( el => el != ic);
                this.gone(ic.peer);
            });
            ic.on('err', (err) => {
                console.log('master:ic:error',ic.peer,err);
            });
        });        
    }

    send( events) {
        if ( this.oc ) {
            this.oc.send(events);
        } else {
            for ( var ic of this.ics ) {
                ic.send(events);            
            }
        }
    }

    
    event( fun, args) {
        if ( this.events.length == 0)
            setTimeout( ()=>this.flush(), 1);

        this.events.push({fun,args});
    }

    flush() {

        this.scene.exec(this.events);
        if ( this.oc ) {
            // slave
            this.oc.send( this.events );
        }
        if ( this.ics.length) {
            // master
            this.ics.forEach( ic => ic.send(this.events))
        }
        this.events = [];
    }

    move(id,x,y,state,owner) {
        this.event( "move", [id,x,y,state,owner]);        
    }

    user(id,name) {
        console.log("event:user",id,name);
        this.event( "user", [id,name]);        
    }

    gone(id) {
        console.log("event:gone",id);
        this.event( "gone", [id]);        
    }

    call(id,cb) {
        if ( id == this.peer.id) {
            console.log("call (local)",id);
            this.scene.stream.then( cb ).catch( err => {
                console.log(err);
            })
        } else {
            console.log("call",id);
            this.scene.stream.then( stream => {
               console.log("call", id, "providing", stream);
               var call = this.peer.call(id, stream);
               call.on('stream', s=>{
                  console.log("call",id,"receiving", s);
                   cb(s);
               });
            });
        }
    }
}
