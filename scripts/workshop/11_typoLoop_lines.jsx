// @include ~/Documents/basiljs/basil.js;

function draw() {

  clear( doc() );

  fill(255, 200, 20);

  textSize(36);
  textFont("Helvetica", "Bold");

  var tf = text(LOREM, 30, 20, 150, 260);
  var myWords = words(tf);


  for(var i = 0; i < myWords.length; i++) {

    typo(myWords[i], "skew", i);

    // check if a word contains a certain string
    if(myWords[i].contents === "dolor") {
      typo(myWords[i], "underline", true);
    }

    // turn a word blue, if it starts with "a"
    if( startsWith(myWords[i].contents, "a") ) {
      typo(myWords[i], "fillColor", color(0, 0, 255));
    }

  }

}
