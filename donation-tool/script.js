/*
How to phrase "giving a mosquito net"
how to phrase "similarity to myself" (how to set this based on location?
Have some entries which are local generics. Specify Indianapolis for these.

Ask how much you value your own time? Probably do this to say "how much more effective is this charity as opposed"

Pay people a salary.

guess we have to start...

LIST OF CHARITIES:
1. The Malaria Foundation.
1. Hellen Keller Intl.
1. GiveDirectly
1. ASPCA
1. Some other animal welfare fund
1. Hope4Kids or equivalent

*/

const myMeasures = ["religion","feed","depression","home","health","life","sight","myself","partner","sibling","friend","neighbor","townman","countryman","westman","stranger","animal"];


/*

myMultipliers=["myself","partner","sibling","friend","neighbor","townman","countryman","westman","stranger","animal"];

myMeasures=[
{
  name:"religion",
  description: "One conversion to my religion",
  hovertext: "The guy loves your god now",
  correls: {},
},
];

*/

myDivs = {};
for (i of myMeasures) {
  myDivs[i]=document.getElementById(i);
}

myCauses = ["malaria","animalrights"];

/*
function addCorrel(measure,cause,multiplier,customMultiplier) {

}
addCorrel("life","animalrights","animal",100)
*/



myCauseDivs = {}
for (i of myCauses) {
  myCauseDivs[i]=document.getElementById(i);
}

const results = document.getElementById("results");

function update() {
  V = {} // Value assigned
  for (i of myMeasures) {
    V[i]=myDivs[i].value;
  }

  // Value assessments
  ranks = [];
  ranks.push(["malaria",V["stranger"]*V["health"]*100]);
  ranks.push(["animalrights",V["life"]*V["animal"]]);

  ranks=ranks.sort((a, b) => b[1] - a[1]); 
  for (let i=0;i<myCauses.length;i++) {
    results.append(myCauseDivs[ranks[i][0]]);
  }
}

// Run once on page load
update();

// Run every time a value changes
for (i of Object.values(myDivs)) {
  i.addEventListener("input", update);
}
for (i of Object.values(myCauseDivs)) {
  i.addEventListener("input", update);
}