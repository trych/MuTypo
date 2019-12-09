// @include ~/Documents/basiljs/basil.js;

function draw() {

  clear( doc() );

  noFill();

  rect(0, 0, 80, 120);

  ellipse(100, 100, 60, 60);

  line(105, 297, 210, 20);

  // create a complex shape and close it in the end
  beginShape();

    vertex(140, 140);
    vertex(200, 60);
    vertex(30, 180);
    vertex(140, 60);
    vertex(98, 12);

  endShape(CLOSE);

}
