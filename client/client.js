/* ==========================
      VIST PRO CLIENT
========================== */

let ws=null;

let myName="";
let roomCode="";
let myHand=[];

let myId =
localStorage.getItem("vist_player_id");

let currentTurn="";
let currentPhase=1;

let connected=false;

let solitaireMode=false;
let selectedSolitaire=[];


/* ==========================
 LOAD
========================== */

window.onload=()=>{

$("#createRoomBtn").onclick=createRoom;
$("#joinBtn").onclick=joinRoom;

$("#sendBtn").onclick=sendChat;

$("#msg").addEventListener(
"keydown",
e=>{
if(e.key==="Enter")
sendChat();
});

};


/* ==========================
 SHORTCUT
========================== */

function $(id){
return document.getElementById(id);
}



/* ==========================
 SOCKET
========================== */


function connect(callback){


ws=new WebSocket(
"wss://card-game-server-71ec.onrender.com"
);


ws.onopen=()=>{

connected=true;

if(callback)
callback();

};


ws.onclose=()=>{

connected=false;


setTimeout(()=>{

if(myName && roomCode){

connect(()=>{

login();

});

}

},2000);

};



ws.onerror=()=>{

console.log("connection error");

};



ws.onmessage=(e)=>{


let data;


try{

data=JSON.parse(e.data);

}catch{

return;

}


handle(data);


};


}





/* ==========================
 LOGIN
========================== */


function login(){


ws.send(JSON.stringify({

type:"JOIN",

name:myName,

room:roomCode,

playerId:myId

}));


}




function createRoom(){


myName=$("#name")
.value.trim();


if(!myName)

return alert(
"Въведи име"
);



roomCode=

Math.random()
.toString(36)
.substring(2,8)
.toUpperCase();



$("#room").value=
roomCode;



connect(()=>{

login();

});


}





function joinRoom(){


myName=
$("#name")
.value.trim();


roomCode=
$("#room")
.value.trim()
.toUpperCase();



if(
!myName ||
!roomCode
)

return alert(
"Попълни име и стая"
);



connect(()=>{

login();

});


}







/* ==========================
 SERVER EVENTS
========================== */


function handle(data){



/* ID */


if(

data.type==="WELCOME"

||

data.type==="RECONNECTED"

){


myId=data.id;


localStorage.setItem(

"vist_player_id",

myId

);

}






/* STATE */


if(data.type==="STATE"){


currentPhase=data.phase;


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


myHand=data.cards || [];


drawHand();


drawOpponents();


}







/* GAME */


if(data.type==="GAME"){


$("#status").innerText=
data.name;



if(
data.name==="Пасианс"
){

startSolitaire();

}

else{

solitaireMode=false;

}


}







/* TURN */


if(data.type==="TURN"){


currentTurn=data.player;


$("#turn").innerText=

"На ход: "+data.player;


}







/* PLAYED */


if(data.type==="PLAYED"){


putCard(
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


removeBack();


}



}







/* CLEAR TABLE */


if(data.type==="CLEAR"){


setTimeout(()=>{


$("#table")
.innerHTML="";


},800);


}






/* SCORES */


if(data.type==="SCORES"){


drawScores(

data.scores

);


}








/* TRUMP */


if(

data.type==="TRUMP_CHOOSE"

){



if(

data.player===myName

)

$("#trumps")
.classList
.remove("hidden");


else

$("#trumps")
.classList
.add("hidden");


}







/* SOLITAIRE MOVE */


if(

data.type==="SOLITAIRE_MOVE"

){


drawSolitaire(

data.cards

);


}







/* GAME OVER */


if(

data.type==="GAME_OVER"

){


alert(

"🏆 Победител: "

+

data.winner.winner

+

"\nТочки: "

+

data.winner.score

);


}


}









/* ==========================
 UI
========================== */



function showGame(){


$("#login")
.style.display="none";


$("#game")
.style.display="block";


}





function drawPlayers(
players,
spectators
){



let html=
"<h3>Играчите</h3>";



players.forEach(p=>{


html+=`

<div>

${p.online?"🟢":"🔴"}

${escapeHtml(p.name)}

</div>

`;


});



html+=`

<hr>

👁 Зрители:
${spectators}

`;



$("#players").innerHTML=html;


}







function drawScores(scores){


let html="<h3>Точки</h3>";



for(let p in scores){


html+=`

<div>

${escapeHtml(p)}
:
${scores[p]}

</div>

`;

}



$("#scores")
.innerHTML=html;


}








/* ==========================
 CARDS
========================== */



function cardFile(card){


const map={

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


let box=$("#hand");


box.innerHTML="";



myHand.forEach(card=>{


let div=
document.createElement("div");


div.className="card";


div.innerHTML=

`

<img src="${cardFile(card)}">

`;




div.onclick=()=>{



if(solitaireMode){


selectSolitaire(
card,
div
);


return;


}





if(

currentTurn!==myName

)

return;



play(card);


};



box.appendChild(div);


});


}







function play(card){


if(!connected)return;



ws.send(JSON.stringify({

type:"PLAY",

card

}));


}









function putCard(card){


$("#table").innerHTML+=`

<div class="card">

<img src="${cardFile(card)}">

</div>

`;


}









/* ==========================
 BACK CARDS
========================== */


function drawOpponents(){


[

"opponent-top",

"opponent-left",

"opponent-right"

]

.forEach(id=>{


let el=$(id);


if(!el)return;


el.innerHTML="";


for(
let i=0;
i<13;
i++
)


el.innerHTML+=`

<div class="back-card">

<img src="cards/back.png">

</div>

`;


});


}






function removeBack(){


for(
let id of
[
"opponent-top",
"opponent-left",
"opponent-right"
]
){


let el=$(id);


if(
el &&
el.children.length
){

el.removeChild(
el.lastChild
);

break;

}

}


}










/* ==========================
 TRUMP
========================== */


function chooseTrump(suit){


ws.send(JSON.stringify({

type:"TRUMP",

suit

}));



$("#trumps")
.classList
.add("hidden");


}










/* ==========================
 SOLITAIRE
========================== */


function startSolitaire(){


solitaireMode=true;


selectedSolitaire=[];



$("#table").innerHTML=

`

<div id="solitaire-board">

<h2>Пасианс</h2>

<div id="solitaire-cards"></div>

<button onclick="sendSolitaire()">

Постави

</button>

</div>

`;


}






function selectSolitaire(card,el){


if(
selectedSolitaire.includes(card)
){


selectedSolitaire=

selectedSolitaire.filter(

c=>c!==card

);


el.style.transform="";


}

else{


selectedSolitaire.push(card);


el.style.transform=

"translateY(-25px)";


}


}






function sendSolitaire(){



if(

selectedSolitaire.length===0

)

return;



ws.send(JSON.stringify({

type:"SOLITAIRE",

cards:selectedSolitaire

}));




selectedSolitaire=[];


}







function drawSolitaire(cards){



let box=

$("#solitaire-cards");



if(!box)return;



cards.forEach(c=>{


box.innerHTML+=`

<div class="card">

<img src="${cardFile(c)}">

</div>

`;


});


}









/* ==========================
 CHAT
========================== */


function sendChat(){


let text=

$("#msg")
.value
.trim();



if(!text)return;



ws.send(JSON.stringify({

type:"CHAT",

name:myName,

text

}));



$("#msg").value="";


}









/* ==========================
 SECURITY
========================== */


function escapeHtml(t){


return String(t)

.replaceAll("&","&amp;")

.replaceAll("<","&lt;")

.replaceAll(">","&gt;");


}