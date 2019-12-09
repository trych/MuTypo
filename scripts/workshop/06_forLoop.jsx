// @include ~/Documents/basiljs/basil.js;

function draw() {

  clear( doc() );
  noFill();

  stroke(255, 20, 20);

  var yPos = height / 5;
  var xPos = 20;

  for(var i = 0;  i < 200; i++) {

    ellipse(xPos + i, yPos + i * 2, 50);

  }

}
