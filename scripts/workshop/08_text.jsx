// @include ~/Documents/basiljs/basil.js;

function draw() {

  clear( doc() );

  fill(255, 0, 0);

  textSize(48);

  textLeading(60);
  textAlign(Justification.RIGHT_ALIGN);

  textFont("Helvetica", "Bold Oblique");
  text(LOREM, 30, 20, 150, 300);

}
