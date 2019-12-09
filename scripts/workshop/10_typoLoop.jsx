// @include ~/Documents/basiljs/basil.js;

function draw() {

  clear( doc() );

  fill(248, 123, 22);

  textSize(36);
  textFont("Helvetica", "Bold");

  var tf = text(LOREM, 30, 20, 150, 260);
  var myWords = words(tf);


  for(var i = 0; i < myWords.length; i++) {

    typo(myWords[i], "skew", random(-60, 60));
    typo(myWords[i], "fillColor", color(random(255), random(100), random(50)));

  }

}
