
/*

    interface Channel {

        id
        name

        send( list );
        receive( list => {})
        close()
    }


*/

class Master {

    constructor(app) {
        this.app = app;
        this.channels = {};
        this.channels[app.id]=app;
    }

    add( channel ) {
        this.channels[channel.id] = channel;

        channel.receive( list=> {
            this.broadcast(channel,list);
        });

        this.broadcast( "users", [Objects.keys(this.channels)])
        channel.send( app.initial() );
    }

    remove( id ) {
        this.channels[id].close();
        delete this.channels[id];
        this.broadcast( [ { fun:"users", args: [Objects.keys(this.channels)]}]);
    }

    broadcast( exclude, list) {
        Objects.values(this.channels).forEach( ch => {
            if (ch != exclude)
                ch.send( list ) 
        });
    }


}

class Slave {
    
    slave(channel) {
        this.channel = channel;
    }

    send( list ) {

    }

}
