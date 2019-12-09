// @include ~/Documents/basiljs/basil.js;

function draw() {

  clear( doc() );

  noStroke();

  for(var i = 0;  i < 100; i++) {

    var dia = random(20, 40);
    var radius = dia / 2;

    var x = random(radius, width - radius);
    var y = random(radius, height - radius);


    fill( random(255) , random(100), random(100));

    ellipse(x, y, dia);
  }

}
