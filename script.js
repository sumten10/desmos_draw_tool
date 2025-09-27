

let calcElt = document.getElementById('calculator');
let calculator = Desmos.GraphingCalculator(calcElt);

let mouse_x = 0;
let mouse_y = 0;
let mouse_inside_calc = false

// Cubic Bezier curve points
let p0 =  {x: 0,y: 0} // start
let p1 =  {x: 0,y: 0} //
let p2 =  {x: 0,y: 0} // control points
let p3 =  {x: 0,y: 0} // end

let n_curves = 0
let target_point = {x: 0,y: 0}
let current_linesize = 2.5
let current_opacity = 1.0

let points = []

let curve_bezier_latex = `c\\left(x,y,z,w,t\\right)=\\left(1-t\\right)^{3}x+3t\\left(1-t\\right)^{2}y+3\\left(1-t\\right)t^{2}z+t^{3}w\\ \\left\\{0\\le t\\le1\\right\\}`
let curve_template_latex = `\\left(c\\left(x_{0},x_{1},x_{2},x_{3},t\\right),c\\left(y_{0},y_{1},y_{2},y_{3},t\\right)\\right)`

// write points into the expression list
for (let i = 0;i < 4;i++) {


  let color = "RED";
  if (i === 0) color = "BLUE"
  else if (i === 3) color = "RED"
  else color = "BLACK"


  calculator.setExpression({id:`x${i}`, color:color, latex:`x_${i}=0`})
  calculator.setExpression({id:`y${i}`, color:color, latex:`y_${i}=0`})
  calculator.setExpression({id:`p_${i}`, color:color, latex:`p_${i}=(x_${i}, y_${i})`})
  points[i] = calculator.HelperExpression({latex:`p_${i}`})
}

// save points from the expression list into an array for later use.
points[0].observe('listValue', function () {
  console.log(points[0].listValue)
});


calculator.setExpression({id:"c_formula", lineWidth: current_linesize, latex:curve_bezier_latex})
calculator.setExpression({id:"curve_template",color: "RED",latex:curve_template_latex})




document.addEventListener('mousemove', (e) => {
  mouse_x = e.clientX;
  mouse_y = e.clientY;
})

calcElt.addEventListener('mouseenter', () => {
  mouse_inside_calc = true
});

calcElt.addEventListener('mouseleave', () => {
  mouse_inside_calc = false

});

function get_mouse_pos() {
  var calculatorRect = calcElt.getBoundingClientRect();
  let coords = calculator.pixelsToMath({
    x: mouse_x - calculatorRect.left,
    y: mouse_y - calculatorRect.top})

    coords.x = +coords.x.toFixed(5)
    coords.y = +coords.y.toFixed(5)
    
    return coords
}


function download(content, fileName, contentType) {
    var a = document.createElement("a");
    var file = new Blob([content], {type: contentType});
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
}



function add_curve(x0, y0, x1, y1, x2, y2, x3, y3) {
  n_curves += 1
  // ( c(x0,x1,x2,x3), c(y0,y1,y2,y3) ) in LaTeX
  let curve_latex = `\\left(c\\left(${x0},${x1},${x2},${x3},t\\right),c\\left(${y0},${y1},${y2},${y3},t\\right)\\right)`
  calculator.setExpression({id:`c${n_curves}`, lineOpacity: current_opacity, lineWidth: current_linesize, latex:curve_latex, color:"BLACK"})
}

function set_target_point(x, y, no_draw = false) {

  let x_diff = Math.abs(points[0].listValue[0] - points[3].listValue[0])
  let y_diff = Math.abs(points[0].listValue[1] - points[3].listValue[1])
  
  // makes sure to not draw any curves if the starting and endpoint are the same
  if ((x_diff > 0.00001 || y_diff > 0.00001) && (no_draw === false)) {
    add_curve(
      x0 = points[0].listValue[0],
      y0 = points[0].listValue[1],
      x1 = points[1].listValue[0],
      y1 = points[1].listValue[1],
      x2 = points[2].listValue[0],
      y2 = points[2].listValue[1],
      x3 = points[3].listValue[0],
      y3 = points[3].listValue[1],
    )
  }
  for (let i = 0; i < 4;i++) {
    calculator.setExpression({id:`x${i}`, latex:`x_${i}=${x}`})
    calculator.setExpression({id:`y${i}`, latex:`y_${i}=${y}`})
  }
  target_point = {x, y}
}

function put_new_line(x,y) {

  let x_diff = Math.abs(points[0].listValue[0] - points[3].listValue[0])
  let y_diff = Math.abs(points[0].listValue[1] - points[3].listValue[1])

  if (x_diff > 0.00001 || y_diff > 0.00001) {
    add_curve(
      x0 = points[0].listValue[0],
      y0 = points[0].listValue[1],
      x1 = points[1].listValue[0],
      y1 = points[1].listValue[1],
      x2 = points[2].listValue[0],
      y2 = points[2].listValue[1],
      x3 = points[3].listValue[0],
      y3 = points[3].listValue[1],
    )
  }

  //swap the startpoint for the end point and new endpoint goes to cursor position
  calculator.setExpression({id:"x0", latex:`x_0=${points[3].listValue[0]}`})
  calculator.setExpression({id:"y0", latex:`y_0=${points[3].listValue[1]}`})

  calculator.setExpression({id:"x3", latex:`x_3=${x}`})
  calculator.setExpression({id:"y3", latex:`y_3=${y}`})


  calculator.setExpression({id:"x1", latex:`x_1=${lerp(x, points[3].listValue[0], 0.6)}`})
  calculator.setExpression({id:"y1", latex:`y_1=${lerp(y, points[3].listValue[1], 0.6)}`})

  calculator.setExpression({id:"x2", latex:`x_2=${lerp(x, points[3].listValue[0], 0.4)}`})
  calculator.setExpression({id:"y2", latex:`y_2=${lerp(y, points[3].listValue[1], 0.4)}`})
}

document.addEventListener('keydown', function(event) {
  if (event.repeat || !mouse_inside_calc) {
    return;
  }

  let key = event.key.toLowerCase();

  if (key === 's') {
    let coords = get_mouse_pos();
    set_target_point(coords.x, coords.y);
  }
  else if (key === "d") {
    let coords = get_mouse_pos();  
    put_new_line(coords.x, coords.y);
  }
  else if (key === "q") {
    let coords = get_mouse_pos();
    set_target_point(coords.x, coords.y, true)
  }

});


// ui logic --------------------------------------------

const save_button = document.getElementById("save-button");
const graph_name = document.getElementById("name-container");

save_button.addEventListener('click', (e) => {
  let calc_state = calculator.getState(); 
  let name = graph_name.value;

  download(JSON.stringify(calc_state), name + ".json", "text/json")
});

const linesize_el = document.getElementById("line-size");
linesize_el.addEventListener('input', (e) => {
  current_linesize = linesize_el.value;
})

const opacity_el = document.getElementById("line-opacity");
opacity_el.addEventListener('input', (e) => {
  current_opacity = opacity_el.value;
});

function lerp( a, b, alpha ) {
 return a + alpha * ( b - a )
}