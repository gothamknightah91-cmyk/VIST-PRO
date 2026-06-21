/* =====================
   VIST PRO CLIENT FINAL
===================== */

let ws=null;

let myName="";
let currentRoom="";
let myId=localStorage.getItem("vist_id");

let myHand=[];
let currentTurn="";

let reconnectTimer=null;


/* =====================
 HELPERS
===================== */

const $ = id => document.getElementById(id);


function safe(id,fn){

let el=$(id);

if(el) fn(el);

}


/* =====================
 LOAD
===================== */

window.onload=()=>{


safe("createRoomBtn",
e=>e.onclick=createRoom
);


safe("joinBtn",
e=>e.onclick=joinRoom
);


safe("sendBtn",
e=>e.onclick=sendChat
);


safe("msg",e=>{

e.addEventListener(
"keydown",
x=>{

if(x.key==="Enter")
sendChat();

});

});


};





/* =====================
 SOCKET
===================== */

function connect(done){


ws=new WebSocket(

location.origin.replace(
"http",
"ws"
)

);



ws.onopen=()=>{


if(done)
done();


};



ws.onclose=()=>{


clearTimeout(
reconnectTimer
);



reconnectTimer=
setTimeout(()=>{


if(
myName &&
currentRoom
){

connect(()=>{

login();

});

}


},2000);


};



ws.onmessage=e=>{


let data;


try{

data=JSON.parse(
e.data
);

}catch{

return;

}


handle(data);


};



}







/* =====================
 LOGIN
===================== */


function login(){


ws.send(

JSON.stringify({

type:"JOIN",

name:myName,

room:currentRoom,

playerId:myId

})

);


}







function createRoom(){


let n=$("name");

let r=$("room");


if(!n)return;



myName=
n.value.trim();


if(!myName)

return alert(
"Въведи име"
);



currentRoom=

Math.random()
.toString(36)
.substring(2,8)
.toUpperCase();



if(r)
r.value=currentRoom;



connect(()=>{

login();

});


}







function joinRoom(){


let n=$("name");

let r=$("room");



if(!n || !r)return;



myName=
n.value.trim();


currentRoom=
r.value.trim()
.toUpperCase();




if(
!myName ||
!currentRoom
)

return alert(
"Попълни данните"
);



connect(()=>{

login();

});


}







/* =====================
 SERVER EVENTS
===================== */


function handle(data){



/* ID */

if(

data.type==="WELCOME"

||

data.type==="RECONNECTED"

){


myId=data.id;


localStorage.setItem(

"vist_id",

myId

);


}




/* STATE */

if(data.type==="STATE"){


showGame();



drawPlayers(

data.players,

data.spectators

);


drawScores(
data.scores
);


}





/* HAND */

if(data.type==="HAND"){


showGame();


myHand=
data.cards || [];


drawHand();


drawBacks(
"opponent-top",
13
);


drawBacks(
"opponent-left",
13
);


drawBacks(
"opponent-right",
13
);


}







/* GAME */

if(data.type==="GAME"){


safe(
"status",

e=>e.innerText=data.name

);


}






/* TURN */

if(data.type==="TURN"){


currentTurn=data.player;


safe(
"turn",

e=>{

e.innerText=

"На ход е: "

+

data.player;


});


}







/* PLAYED */


if(data.type==="PLAYED"){



addToTable(
data.card
);



if(
data.player===myName
){


myHand=

myHand.filter(

c=>c!==data.card

);


drawHand();


}

else{

removeOpponentCard();

}



}







/* CLEAR */


if(data.type==="CLEAR"){


setTimeout(()=>{


safe(
"table",

e=>e.innerHTML=""

);


},700);


}






/* SCORE */


if(data.type==="SCORES"){


drawScores(
data.scores
);


}







/* CHAT */


if(data.type==="CHAT"){


safe(
"messages",

box=>{


box.innerHTML+=

`

<div>

<b>${data.name}</b>:

${data.text}

</div>

`;



box.scrollTop=
box.scrollHeight;


});


}





/* TRUMP */


if(
data.type==="TRUMP_CHOOSE"
){


if(
data.player===myName
)

$("trumps")
.classList
.remove("hidden");


}



if(
data.type==="TRUMP_SET"
){


$("trumps")
.classList
.add("hidden");


}






/* END */


if(
data.type==="GAME_OVER"
){


alert(

"🏆 Победител: "

+

data.winner.winner

);


}



}










/* =====================
 UI
===================== */


function showGame(){


safe(
"login",

e=>e.style.display="none"

);



safe(
"game",

e=>e.style.display="block"

);


}







function drawPlayers(players=[],spectators=0){



let box=$("players");


if(!box)
return;



let html=
"<h3>Играчите</h3>";



players.forEach(p=>{


html+=`

<div>

${p.online?"🟢":"🔴"}

${p.name}

</div>

`;


});



html+=`

<hr>

👁 ${spectators}

`;



box.innerHTML=html;


}







function drawScores(scores={}){


safe(
"scores",

box=>{


let h="<h3>Точки</h3>";



for(let p in scores)

h+=`

<div>

${p}: ${scores[p]}

</div>

`;



box.innerHTML=h;


});


}







/* =====================
 CARDS
===================== */


function cardToFile(card){


let map={

"♠":"S",

"♥":"H",

"♦":"D",

"♣":"C"

};


return (

"cards/"

+

card.slice(1)

+

map[card[0]]

+

".png"

);


}








function drawHand(){


let hand=$("hand");


if(!hand)return;



hand.innerHTML="";



myHand.forEach(card=>{


let d=
document.createElement(
"div"
);


d.className="card";


d.innerHTML=

`

<img src="${cardToFile(card)}">

`;



d.onclick=()=>{


if(
currentTurn===myName
)

play(card);


};



hand.appendChild(d);


});


}







function play(card){


ws.send(

JSON.stringify({

type:"PLAY",

card

})

);


}







function addToTable(card){


safe(
"table",

t=>{


t.innerHTML+=`

<div class="card">

<img src="${cardToFile(card)}">

</div>

`;

});


}










function drawBacks(id,count){


let el=$(id);


if(!el)return;


el.innerHTML="";


for(
let i=0;i<count;i++
)

el.innerHTML+=

`

<div class="back-card">

<img src="cards/back.png">

</div>

`;


}






function removeOpponentCard(){


[
"opponent-top",
"opponent-left",
"opponent-right"

].some(id=>{


let e=$(id);


if(
e &&
e.children.length
){

e.lastChild.remove();

return true;

}


});


}








/* =====================
 CHAT
===================== */


function sendChat(){


let m=$("msg");


if(!m)return;



let text=
m.value.trim();



if(!text)return;



ws.send(

JSON.stringify({

type:"CHAT",

name:myName,

text

})

);



m.value="";


}







/* =====================
 TRUMP
===================== */


function chooseTrump(suit){


ws.send(

JSON.stringify({

type:"TRUMP",

suit

})

);


}
