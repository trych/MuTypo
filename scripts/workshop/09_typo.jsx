// @include ~/Documents/basiljs/basil.js;

function draw() {

  clear( doc() );

  fill(0, 0, 255);

  textSize(48);

  textFont("Helvetica", "Bold");

  var tf = text(LOREM, 30, 15, 150, height);

  typo(tf, "skew", 36);
  typo(tf, "verticalScale", 200);

}
