// @include ~/Documents/basiljs/basil.js;

function draw() {

  // run the mutypo script first on a text frame, then run this script to modify the frames

  // get the first frame of the muTypo frames and save it to a var
  var firstFrame = nameOnPage("MuTypo_1_1");

  // now get the entire chain of text frames linked to that first frame
  var myTextFrames = linkedTextFrames(firstFrame);


  // loop over all these text frames
  for(var i = 0; i < myTextFrames.length; i++) {

    // rotate each text frame a bit more
    transform( myTextFrames[i], "rotate", i * 2 );

    // give each text frame a random color
    // note: due to a bug in basil.js, the following does not really work currently
    // basil does not use the typo() command on the text frame's text only but on the
    // entire paragraph spanning several text frames instead - let's hope this gets fixed soon! :)
    // typo( myTextFrames[i], "fillColor", color(random(255), random(255), random(255)));

    // instead, to make it work for now, you can use this:
    myTextFrames[i].textColumns[0].fillColor = color(random(255), random(255), random(255));

    // and give each text frame's text a random vertical scale
    myTextFrames[i].textColumns[0].verticalScale = random(20, 200);

  }

}
