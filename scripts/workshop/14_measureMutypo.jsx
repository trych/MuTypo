// @include ~/Documents/basiljs/basil.js;

function draw() {

  var firstFrame = nameOnPage("MuTypo_1_1");
  var myTextFrames = linkedTextFrames(firstFrame);

  noFill();

  for(var i = 0; i < myTextFrames.length; i++) {

    var x = measure(myTextFrames[i], "x");
    var y = measure(myTextFrames[i], "y");
    var w = measure(myTextFrames[i], "width");

    ellipse(x, y, w + 20);
    line(x, y, width, height);

  }

}
