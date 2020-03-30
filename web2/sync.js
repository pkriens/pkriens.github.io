
class Shared {
	
	constructor(app, id) {
		this.app = app;
		this.options = {
			    debug:  0,
			    host: "peerjs.aqute.biz",
				//port: 9001,
				//path: "/myapp",
				//key: "peerjs"
				 //,
				 config: {'iceServers': [
				    { url: 'turn:peerjs.aqute.biz:3478', username: "aQute", credential: "turn6754"},
				    { url: 'stun:peerjs.aqute.biz:3478', username: "aQute", credential: "turn6754"}
		          ]} 
	        };
		this.peer 	= new Peer(id,this.options);
		
	    this.peer.on('open', id => {
	        console.log(':open',id);
	        this.app.streams.push( { id: this.peer.id, stream: this.app.stream } );
	        this.app.id = this.peer.id;
	        this.app.users.push(app.newUser(this.peer.id, this.app.name, true));
	        this.open();
	    });
	    
	    this.peer.on('call', (call) => {
	        console.log("call from", call.peer,"answer", this.app.stream.id);
	      	call.answer(this.app.stream);
	      	
	      	call.on('stream', stream => {
		        console.log("accept stream", stream.id, "from", call.peer);
		        this.app.streams = this.app.streams.filter( sd => sd.id != call.peer );
		        this.app.streams.push( { id: call.peer, stream: stream });
	      	});
	      	call.on('close', x => {
		        console.log("call closed", call.peer );
		        this.app.streams = this.app.streams.filter( sd => sd.id != call.peer );
	      	});
	    });
	    
	    this.peer.on('error', err => {
	        this.error('shared:error',err);
	    });
	    
	    this.peer.on('disconnected', err => {
	        this.peer.reconnect();
	        this.error('shared:disconnct',err);
	    });
	}
	
	error(msg,err) {
		console.log(msg,err);
		this.app.errors.push(err);
	}
	
    close() {
		console.log('shared:close');
    	this.peer.close();
    }
    
}

class Slave extends Shared {
	
    constructor(app,masterId) {
    	super(app);
    	this.masterId = masterId;
    	this.app.oc = null;
    }
    
    open(){
        var oc = this.peer.connect(this.masterId, { metadata: {name: this.app.name }});

        console.log("slave:connect to master", this.masterId );

        oc.on('open', () => {
            console.log("slave:open", oc );
            this.app.oc = oc;
        });

        oc.on('data', data => {
        	if ( Array.isArray(data))
        		this.send(data, oc);
        	else {
        		switch( data.fun ) {
        		
        		// New slaves will get a list of existing
        		// participants
        		// the slave then contacts them all
        		
        		case 'others':
        			var l = data.args[0];
        			l.forEach( u => {
        				console.log("set user", u)
        				this.app.users.push(this.app.newUser( u.id, u.name, false ));

        				var call = this.peer.call(u.id, this.app.stream);
        				if ( !call ) {
        					this.error('failed to call peer ', u.id);
        				} else {
	        				call.on('stream', stream=>{
	            				console.log("slave:others stream", u,stream.id)
	            				this.app.streams = this.app.streams.filter( sd => sd.id != call.peer );
	        					this.app.streams.push( { id: call.peer, stream: stream});
	        				});
	        				
	        				call.on('close', ()=>{
	            				console.log("slave:others close", u)
	            				this.app.streams = this.app.streams.filter( sd => sd.id != call.peer );
	        				});
	        				call.on('error', err=> {
	            				this.app.streams = this.app.streams.filter( sd => sd.id != call.peer );
	        					this.error('calling ' + u.id,err);
	        				});
        				}
        			});
        			break;
        			
        		case 'user':
        			var u = data.args[0];
        			console.log("add", u);
        			this.app.users = this.app.users.filter( u=> u.id != uid);
        			this.app.users.push(u);
        			break;

        		case 'gone':
        			var uid = data.args[0];
        			console.log("remove", uid);
        			this.app.users = this.app.users.filter( u=> u.id != uid);
        			break;
        			
        		}
        	}
        		
        });

        oc.on('close', () => {
            console.log('slave:close');
            //setTimeout(()=>this.open(),1000);
            this.app.oc = null;
        });

        oc.on('error', (err) => {
            console.log('slave:error');
            this.app.oc = null;
	        this.error(err);
	        setTimeout( ()=>this.open(), 3000);
        });
    }
    
    send( events, exclude ) {
    	
    	if ( this.app.oc != exclude)
    		this.app.oc.send(events);

    	this.app.send(events);
    }

}

class Master extends  Shared {
	
    constructor(app) {
    	super(app,"master");
    }
    
    open() {
        this.peer.on('connection', ic => {
            console.log("master:ic:connection",ic.peer);

            this.app.ics = this.app.ics.filter( x => x.peer != ic.peer );
            
            ic.on('open', (x) => {
                console.log('master:ic:open',ic.peer);
            	var l = this.app.ics.map( ec => { return { id: ec.peer, name: ec.metadata.name}} );
            	var u = { id: this.peer.id, name: this.app.name  } ;
            	l.push( u );
                
                this.app.ics.push(ic);
                this.app.users.push( this.app.newUser(ic.peer, ic.metadata.name, false) );
                ic.send( { fun: 'others', args: [l] });
                this.send( { fun: 'user', args: [ { id: ic.peer, name: ic.metadata.name }] }, ic);
            });

            ic.on( 'data', data=> {
                console.log('master:ic:data',ic.peer);
                this.send(data,ic);
            });

            ic.on('close', (x) => {
                console.log('master:ic:close',ic.peer);
                this.app.ics = this.app.ics.filter( x => x.peer != ic.peer );
                this.app.users = this.app.users.filter( u => u.id != ic.peer);
                this.app.ics.forEach( c => c.send( {fun: 'gone', args: [ic.peer]}))
            });
            ic.on('error', (err) => {
                console.log('master:ic:error',ic.peer,err);
    	        this.error(err);
            });
        });         
    }
    
    send( events, exclude) {
    	Object.values(this.app.ics)
    		.filter( ic => ic != exclude )
    		.forEach( ic => ic.send(events));
    	this.app.send(events);
    }
}
