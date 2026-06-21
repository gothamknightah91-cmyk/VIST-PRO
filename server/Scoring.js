/* =========================
   VIST SCORING ENGINE
========================= */


/*

phase:

1 = отрицателни игри
2 = козове
3 = пасианс


negativeRound:

0 Без купи
1 Без ръце
2 Без мъже
3 Без дами
4 Без поп купа
5 Без последни две
6 Без всичко

*/



function calculate(
phase,
round,
cards,
trickNumber
){


let points=0;


/* =================
   КОЗОВЕ
================= */


if(phase===2){


return 5;


}





/* =================
   ПЪРВА ЧАСТ
================= */


if(phase===1){



/*
Без купи

всяка купа -2
*/


if(
round===0 ||
round===6
){

let hearts=
cards.filter(
c=>c[0]==="♥"
).length;


points+=
hearts*-2;


}





/*
Без ръце

всяка взета ръка -2
*/


if(
round===1 ||
round===6
){

points-=2;

}







/*
Без мъже

Попове и Валета
-3
*/


if(
round===2 ||
round===6
){


let men=
cards.filter(

c=>

c.slice(1)==="K"

||

c.slice(1)==="J"

).length;



points+=
men*-3;


}







/*
Без дами

Q = -7
*/


if(
round===3 ||
round===6
){



let queens=

cards.filter(

c=>c.slice(1)==="Q"

).length;



points+=
queens*-7;



}







/*
Без поп купа

♥K = -18

*/


if(
round===4 ||
round===6
){


if(

cards.includes("♥K")

){

points-=18;

}


}








/*
Последните две ръце

12 и 13

*/


if(
round===5 ||
round===6
){



if(

trickNumber===12

||

trickNumber===13

){


points-=17;


}


}



}





return points;



}









/* =========================
   ADD SCORE
========================= */


function addScore(

scores,

player,

points

){



if(

scores[player]===undefined

)

scores[player]=0;




scores[player]+=points;



return scores;


}










/* =========================
   SOLITAIRE SCORE
========================= */



function solitaireScore(

finishList,
scores

){



const reward=[

20,
10,
0,
-10

];



finishList.forEach(

(name,index)=>{


if(
scores[name]===undefined
)

scores[name]=0;



scores[name]+=reward[index];


}

);



return scores;



}










/* =========================
   FINAL WINNER
========================= */


function getWinner(scores){



let winner=null;

let best=-Infinity;



for(
let name in scores
){


if(
scores[name]>best
){

best=scores[name];

winner=name;

}


}



return {

winner,

score:best

};


}








module.exports={

calculate,

addScore,

solitaireScore,

getWinner

};