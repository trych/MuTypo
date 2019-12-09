// @include ~/Documents/basiljs/basil.js;

function draw() {

  clear( doc() );
  noFill();

  var xPos = width / 4;
  var dia = 20;
  var step = 30;
  var yPos = 50;

  ellipse(xPos, yPos, dia);

  yPos = yPos + step;
  xPos = xPos + step / 2;
  ellipse(xPos, yPos, dia);

  yPos = yPos + step;
  xPos = xPos + step / 2;
  ellipse(xPos, yPos, dia);

  yPos = yPos + step;
  xPos = xPos + step / 2;
  ellipse(xPos, yPos, dia);

  yPos = yPos + step;
  xPos = xPos + step / 2;
  ellipse(xPos, yPos, dia);

  yPos = yPos + step;
  xPos = xPos + step / 2;
  ellipse(xPos, yPos, dia);

  yPos = yPos + step;
  xPos = xPos + step / 2;
  ellipse(xPos, yPos, dia);

}
