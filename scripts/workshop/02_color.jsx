// @include ~/Documents/basiljs/basil.js;

function draw() {

  clear( doc() );

  // fill everything with red from here on
  fill(255, 0, 0);
  stroke(0, 0, 255);

  strokeWeight(5);

  rect(0, 0, 80, 120);

  ellipse(100, 100, 60, 60);

  line(105, 297, 210, 20);

  // fill with yellow from here on
  fill(255, 255, 0);

  beginShape();

    vertex(140, 140);
    vertex(200, 60);
    vertex(30, 180);
    vertex(140, 60);
    vertex(98, 12);

  endShape(CLOSE);

  // fill with grey
  fill(125);
  ellipse(200, 200, 50, 50);

}
