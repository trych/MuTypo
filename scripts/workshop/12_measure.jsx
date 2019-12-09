// @include ~/Documents/basiljs/basil.js;

function draw() {

  clear( doc() );

  fill(51, 200, 39);

  textSize(36);
  textFont("Helvetica", "Bold");


  var tf = text(LOREM, 30, 20, 150, 260);
  var myWords = words(tf);

  // turn off hyphenation
  typo(tf, "hyphenation", false);

  noFill();

  for(var i = 0; i < myWords.length; i++) {

    // measure x and y position as well as width of the current word
    var x = measure(myWords[i], "x");
    var y = measure(myWords[i], "y");
    var w = measure(myWords[i], "width");

    // draw a circle according to these measurements
    ellipse(x, y, w);
  }

}
