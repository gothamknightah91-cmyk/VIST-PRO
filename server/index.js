const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const crypto = require("crypto");
const path = require("path");

const Engine = require("./GameEngine");
const Score = require("./Scoring");
const Solitaire = require("./Solitaire");


const app = express();

app.use(
express.static(
path.join(__dirname,"../client")
)
);


const server =
http.createServer(app);


const wss =
new WebSocket.Server({
server
});



/* =====================
 MEMORY
===================== */


const rooms={};



function uid(){

return crypto
.randomBytes(12)
.toString("hex");

}





/* =====================
 SEND
===================== */


function send(ws,data){

if(
ws &&
ws.readyState===1
){

try{

ws.send(
JSON.stringify(data)
);

}catch{}

}

}



function broadcast(room,data){


[
...Object.values(room.players),
...Object.values(room.spectators)

].forEach(

p=>send(p.socket,data)

);

}








/* =====================
 ROOM
===================== */


function createRoom(code){


rooms[code]={


players:{},

spectators:{},


phase:1,

round:0,


trick:1,


turn:null,


table:[],


scores:{},


trump:null,


trumpChooser:0,


solitaire:null,


started:false,


};


return rooms[code];


}








function state(room){


broadcast(room,{

type:"STATE",


players:

Object.values(room.players)
.map(p=>({

name:p.name,

online:p.online

})),


spectators:

Object.keys(room.spectators)
.length,


scores:room.scores,


phase:room.phase


});


}










/* =====================
 START ROUND
===================== */


function startRound(room){


room.table=[];

room.trick=1;



if(room.phase===3){


room.solitaire =
Solitaire.create();


}



Engine.deal(
room.players
);



Object.values(room.players)
.forEach(p=>{


send(
p.socket,
{

type:"HAND",

cards:p.hand

}

);


});





let first =
Object.keys(room.players)[0];


room.turn=first;





broadcast(room,{

type:"GAME",

name:

room.phase===1

?

Engine.NEGATIVE_GAMES[
room.round
]

:

room.phase===2

?

"Козова игра"

:

"Пасианс"


});






broadcast(room,{

type:"TURN",

player:
room.players[room.turn].name

});



state(room);


}











/* =====================
 CONNECTION
===================== */


wss.on(

"connection",

(ws)=>{

// HEARTBEAT
ws.lastChat = 0;
ws.alive = true;


ws.on("pong",()=>{

ws.alive = true;

});

ws.on(

"message",

(raw)=>{



let data;


try{

data=JSON.parse(raw);

}

catch{

return;

}



try{



/* ========= JOIN ========= */


if(
data.type==="JOIN"
){


let room =
rooms[data.room]
||
createRoom(data.room);





/* reconnect */


if(

data.playerId &&

room.players[
data.playerId
]

){


let p=
room.players[
data.playerId
];


p.socket=ws;

p.online=true;



ws.room=data.room;

ws.id=data.playerId;




send(ws,{

type:"RECONNECTED",

id:data.playerId

});



send(ws,{

type:"HAND",

cards:p.hand

});



state(room);


return;


}







let id=uid();


ws.id=id;

ws.room=data.room;





if(

Object.keys(room.players)
.length <4

){



room.players[id]={

id,

name:data.name,

socket:ws,

online:true,

hand:[]

};



room.scores[
data.name
]=0;



}

else{


room.spectators[id]={

id,

name:data.name,

socket:ws

};



}





send(ws,{

type:"WELCOME",

id

});




state(room);




if(

Object.keys(room.players)
.length===4

&&

!room.started

){


room.started=true;


startRound(room);


}



return;

}







let room=
rooms[ws.room];


if(!room)return;









/* ========= CHAT ========= */


if(data.type==="CHAT"){


let now=Date.now();


if(
now-ws.lastChat<700
)

return;



ws.lastChat=now;



if(

!data.text ||

data.text.length>200

)

return;



broadcast(room,{

type:"CHAT",

name:data.name,

text:data.text

});


return;


}


/* ========= TRUMP SELECT ========= */


if(data.type==="TRUMP"){


let player =
room.players[ws.id];


if(!player)
return;



// позволено само във втора част

if(
room.phase!==2
)

return;




let ids =
Object.keys(room.players);



let chooser =

ids[
room.trumpChooser
];




// само играчът който е наред избира

if(
chooser !== player.id
)

return;




// записваме коз

room.trump =
data.suit;




broadcast(room,{

type:"TRUMP_SET",

suit:data.suit

});




// започваме играта

startRound(room);



return;


}







/* ========= NORMAL PLAY ========= */


if(

data.type==="PLAY"

&&

room.phase<3

){



let player =
room.players[ws.id];



if(!player)return;



if(
room.turn!==player.id
)

return;





if(

!Engine.validMove(

player,

data.card,

room.table

)

)

return;






player.hand=

player.hand.filter(

c=>c!==data.card

);





room.table.push({

id:player.id,

name:player.name,

card:data.card

});





broadcast(room,{

type:"PLAYED",

player:player.name,

card:data.card

});







if(
room.table.length<4
){



let ids=
Object.keys(
room.players
);



let pos=
ids.indexOf(
player.id
);



room.turn=

ids[
(pos+1)%4
];



broadcast(room,{

type:"TURN",

player:

room.players[
room.turn
].name

});



return;


}









/* trick end */



let winner=

Engine.trickWinner(

room.table,

room.trump

);





let pts=

Score.calculate(

room.phase,

room.round,

room.table.map(x=>x.card),

room.trick

);





Score.addScore(

room.scores,

winner.name,

pts

);






broadcast(room,{

type:"SCORES",

scores:room.scores

});





broadcast(room,{

type:"CLEAR"

});






room.table=[];


room.turn=winner.id;


room.trick++;






if(
room.trick>13
){



Engine.nextRound(room);



if(room.finished){


let win=
Score.getWinner(
room.scores
);



broadcast(room,{

type:"GAME_OVER",

winner:win

});


return;

}



startRound(room);



return;


}





broadcast(room,{

type:"TURN",

player:

room.players[
room.turn
].name

});



return;



}










/* ========= SOLITAIRE ========= */



if(

data.type==="SOLITAIRE"

){


let player=
room.players[ws.id];


if(!player)return;




let ok=

Solitaire.play(

room.solitaire,

player,

data.cards

);



if(!ok)return;




broadcast(room,{

type:"SOLITAIRE_MOVE",

player:player.name,

cards:data.cards

});




if(

Solitaire.finished(
room.solitaire
)

){



Score.solitaireScore(

room.solitaire.finished,

room.scores

);




Engine.nextRound(room);



startRound(room);



}




return;


}






}catch(e){


console.log(
"GAME ERROR",
e
);


}



});








ws.on(

"close",

()=>{



let room=
rooms[ws.room];


if(!room)return;



let p=
room.players[ws.id];



if(p){


p.online=false;

p.socket=null;


state(room);


}



});



}

);



/* =====================
   HEARTBEAT CHECK
===================== */


setInterval(()=>{


wss.clients.forEach(ws=>{


if(ws.alive===false){


return ws.terminate();


}


ws.alive=false;


ws.ping();


});


},30000);

/* =====================
   ROOM CLEANER
===================== */


setInterval(()=>{


for(let code in rooms){


let room=rooms[code];


let activePlayers =

Object.values(room.players)

.filter(p=>p.online)

.length;



let activeSpectators =

Object.values(room.spectators)

.filter(s=>s.socket)

.length;




if(

activePlayers===0

&&

activeSpectators===0

){


delete rooms[code];


console.log(

"Deleted room:",code

);


}



}



},10*60*1000);


server.listen(

process.env.PORT || 8080,

()=>{

console.log(

"VIST PRO READY"

);

}

);
