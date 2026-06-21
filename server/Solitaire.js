/* =========================
   SOLITAIRE ENGINE
   VIST PART 3
========================= */


const SUITS=[
"♠",
"♥",
"♦",
"♣"
];


const ORDER=[
"2",
"3",
"4",
"5",
"6",
"7",
"8",
"9",
"10",
"J",
"Q",
"K",
"A"
];




/* =========================
 CREATE BOARD
========================= */


function create(){

let board={};


SUITS.forEach(s=>{


board[s]={

opened:false,

low:9,

high:9,

cards:[]

};


});



return {

board,

finished:[]

};


}









/* =========================
 CHECK CARD
========================= */


function canPlace(

state,

card

){


let suit=
card[0];


let rank=
card.slice(1);


let place=
state.board[suit];



let value=
ORDER.indexOf(rank)+2;



// първа карта трябва да е 9


if(
!place.opened
){


return value===9;


}




// надолу


if(

value===place.low-1

)

return true;




// нагоре


if(

value===place.high+1

)

return true;




return false;


}









/* =========================
 PLAY CARDS
========================= */



function play(

state,

player,

cards

){


// няма карти


if(
!cards ||
!cards.length
)

return false;




/*
сортираме ги така,
че ако даде серия
да се наредят правилно
*/


cards.sort(

(a,b)=>

ORDER.indexOf(a.slice(1))

-

ORDER.indexOf(b.slice(1))

);





for(
let card of cards
){


if(

!canPlace(
state,
card
)

)

return false;




apply(

state,

card

);


}




// махаме от ръката


player.hand =

player.hand.filter(

c=>!cards.includes(c)

);




// приключил


if(

player.hand.length===0

&&

!state.finished.includes(
player.name
)

){


state.finished.push(

player.name

);


}



return true;



}









/* =========================
 APPLY CARD
========================= */



function apply(

state,

card

){



let suit=
card[0];


let rank=
card.slice(1);


let value=
ORDER.indexOf(rank)+2;



let row=
state.board[suit];





if(value===9){


row.opened=true;


}



if(value<row.low)

row.low=value;



if(value>row.high)

row.high=value;




row.cards.push(card);



}










/* =========================
 AVAILABLE MOVES
========================= */


function possible(

state,

hand

){


return hand.filter(

card=>

canPlace(
state,
card
)

);


}










/* =========================
 ROUND FINISHED
========================= */



function finished(

state

){


return (

state.finished.length===4

);


}











module.exports={

create,

play,

possible,

finished

};