var net=require("net");
Array.prototype.remove=function(e){
    for(var i=0;i<this.length;i++)
    {
        if(e==this[i])
        {
            return this.splice(i,1);
        }
    }
}
var clients=[];
var rooms=[];
function Client(socket)
{
    this.name=null;
    this.room=null;
    this.socket=socket;
}
function Room(name)
{
    this.name=name;
    this.members=[];
}
rooms.push(new Room("chat"));
rooms.push(new Room("hottub"));
function leave(client)
{
                    if(client.room==null)
                    {
                        client.socket.write("You are not in any room\n");
                    }
                    else
                    {
                        client.room.members.remove(client);
                        client.room.members.forEach(function(member){
                            member.socket.write("* user has left "+client.room.name+": "+client.name+"\n");
                            });
                        client.room=null;
                    }
 
}
var server=net.createServer(function(socket){
    var client=new Client(socket);
        socket.setTimeout(0);
        socket.write("Welcome to the XYZ chat server\n");
        socket.write("Login Name?\n");
        socket.on("data",function(data){
            if(client.name==null)
            {
                var tempName=data.toString().match(/\S+/);
                for(var i=0;i<clients.length;i++)
                {
                        if(clients[i].name==tempName[0])
                        {
                            socket.write("Sorry, name taken.\n");
                            return;    
                        }
                } 
                client.name=tempName[0];
                clients.push(client);
                socket.write("Welcome "+client.name+"!\n");
                return;
            }
            var command=data.toString().match(/^\/(.*)/);
            if(command)
            {
                if(command[1]=="rooms")
                {
                    socket.write("Active rooms are:\n");
                    rooms.forEach(function(room){
                        socket.write("* "+room.name+" ("+room.members.length+")\n");
                        });
                    socket.write("end of list.\n");
                }
                else if(command[1]=="leave")
                {
                    leave(client);
                }
                else if(command[1]=="quit")
                {
                    if(client.room!=null)
                        leave(client);
                    clients.remove(client);
                    socket.write("BYE\n");
                    socket.end();    
                }
                else
                {
                    var cmd=command[1].split(" ");
                    if(cmd[0]=="join")
                    {
                        if(cmd[1])
                        {
                            var match=false;
                            rooms.forEach(function(room){
                                if(room.name==cmd[1])
                                {
                                    if(client.room!=null)
                                        leave(client);
                                    socket.write("entering room: "+room.name+"\n");
                                    room.members.push(client);
                                    client.room=room;
                                    room.members.forEach(function(member){
                                        if(member!=client)
                                        member.socket.write("* new user joined "+room.name+": "+client.name+"\n");
                                        socket.write("* "+member.name+"\n");
                                        });
                                    socket.write("end of list\n");
                                    match=true;
                                }
                            });
                            if(!match)
                            socket.write("Please provide a valid room name\n");
                        }
                        else
                            socket.write("Please provide a valid room name\n");
                    }
                    else
                        socket.write("Invalid command\n");
                    
                }
                return;
            }
            if(client.room==null)
                socket.write("Please join a room first, use /rooms to find rooms\n");
            else
            {
                client.room.members.forEach(function(member){
                    member.socket.write(client.name+": "+data);
                    });
            }

            });
    });
server.listen(9399);
