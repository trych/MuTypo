// @include ~/Documents/basiljs/basil.js;

function draw() {

  clear( doc() );

  // save the start size in a variable that you can calculate with later
  var startSize = 50;

  noFill();
  ellipse(width / 2, height / 2, startSize, startSize);
  ellipse(width / 2, height / 2, startSize * 2, startSize * 2);
  ellipse(width / 2, height / 2, startSize * 3, startSize * 3);

  line(0, 0, width, height);

}
