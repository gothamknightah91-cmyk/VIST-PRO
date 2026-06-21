const SUITS = ["♠","♥","♦","♣"];

const RANKS = [
"2","3","4","5","6","7",
"8","9","10","J","Q","K","A"
];


const NEGATIVE_GAMES=[

"Без купи",
"Без ръце",
"Без мъже",
"Без дами",
"Без поп купа",
"Без последни две",
"Без всичко"

];



/* =====================
   DECK
===================== */


function createDeck(){

let deck=[];


for(let s of SUITS){

for(let r of RANKS){

deck.push({

suit:s,

rank:r,

id:s+r

});

}

}


// истинско разбъркване

for(
let i=deck.length-1;
i>0;
i--
){

let j=
Math.floor(
Math.random()*(i+1)
);


[
deck[i],
deck[j]

]=[

deck[j],
deck[i]

];


}


return deck;

}







/* =====================
 DEAL
===================== */


function deal(players){


let deck=createDeck();


let list=
Object.values(players);



list.forEach(
(p,index)=>{


p.hand=
deck
.slice(
index*13,
index*13+13
)
.map(c=>c.id);



});


return list;


}






/* =====================
 VALID MOVE
===================== */



function validMove(
player,
card,
table
){



if(
!player.hand.includes(card)
)

return false;




// първа карта

if(
table.length===0
)

return true;



let lead=

table[0]
.card[0];



// има ли боя


let hasSuit=

player.hand.some(

c=>c[0]===lead

);



// ако има боя трябва да даде


if(
hasSuit &&
card[0]!==lead
)

return false;




return true;


}








/* =====================
 WINNER
===================== */


function trickWinner(

table,

trump=null

){


let winner=
table[0];



for(
let play of table
){


// коз


if(trump){


if(

play.card[0]===trump

&&

winner.card[0]!==trump

)

winner=play;



}




// нормална боя


if(

play.card[0]===winner.card[0]

&&

RANKS.indexOf(
play.card.slice(1)
)

>

RANKS.indexOf(
winner.card.slice(1)
)

)

winner=play;


}



return winner;


}







/* =====================
 NEXT PHASE
===================== */


function nextRound(room){



// първа част

if(room.phase===1){



room.round++;


if(
room.round>=7
){


room.phase=2;

room.round=0;

room.trumpRound=0;


}


return;

}



// козове

if(room.phase===2){



room.trumpRound++;


if(
room.trumpRound>=4
){


room.phase=3;

room.round=0;


}


return;


}



// пасианс


if(room.phase===3){


room.round++;


if(room.round>=4){


room.finished=true;


}


}


}








module.exports={

createDeck,

deal,

validMove,

trickWinner,

nextRound,

NEGATIVE_GAMES

};