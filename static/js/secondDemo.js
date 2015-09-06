/*
This function takes planes aligned with the xy plane to spheres.
 */
var spherical = function(vector) {
	z = vector.z;
	x = vector.x * 0.5;
	y = vector.y * 0.5;
	return new THREE.Vector3(z * Math.sin(x), z * Math.cos(x) * Math.sin(y), z * Math.cos(x) * Math.cos(y));
};

var spherical2D = function(vector) {
	z = vector.z + 5; // vector.z is always zero, but I don't like the no-inverse errors.
	x = vector.x * 0.5;
	y = vector.y * 0.5;
	return new THREE.Vector3(z * Math.sin(x), z * Math.cos(x) * Math.sin(y), z * Math.cos(x) * Math.cos(y));
};

var squiggle_scale = 0.3;
var squiggle = function(vector) {
	z = vector.z; // vector.z is always zero, but I don't like the no-inverse errors.
	x = vector.x;
	y = vector.y;
	return new THREE.Vector3(x + Math.sin(y * squiggle_scale), y + Math.cos(z * squiggle_scale), z * Math.cos(x * squiggle_scale));
};

var squiggle_scale_2 = 1;
var squiggle_2 = function(vector) {
	x = vector.x;
	y = vector.y;
	return new THREE.Vector3(x + 0.5 * Math.sin(y * squiggle_scale_2), y + 0.5 * Math.cos(x * squiggle_scale_2), 0);
};

/*
This function takes planes aligned with the xy plane to toruses.
 */
var donut = function(vector) {
	var a = 3;
	var b = 4;
	var exp = Math.exp(vector.z);
	var scaling = 5;
	var inner_radius = scaling + scaling * exp / (1+exp);
	var radius = scaling * 2;
	var t = Math.sin(0.6 * vector.x) * (radius + (radius - inner_radius) * Math.cos(vector.y));
	var u = (radius - inner_radius) * Math.sin(vector.y);
	var v = Math.cos(0.6 * vector.x) * (radius + (radius - inner_radius) * Math.cos(vector.y));
	return new THREE.Vector3(t, u, v);
};

var identity = function(vector) {
	return new THREE.Vector3().copy(vector);
};

var playPauseHander = function() {
	manifold.animating = !manifold.animating;
	document.getElementById("option").innerHTML = manifold.animating ? "Pause Rendering" : "Resume Interactivity";
};

var toggleInfoPanel = function() {
	$('#info_panel').toggle('slow');
}

var toggleLeapControl = function(){
	if (manifold.cursorControl == "leap") {
		manifold.cursorControl = "mouse";
		document.getElementById("control-button").innerHTML = "Control with Leap Motion";
		document.getElementById("control").innerHTML = "Mouse";
	} else {
		if (!manifold.leapIntialized) {
			manifold.leapIntialized = true;
			manifold.tryToControlInputWithLeap();
		}
		manifold.cursorControl = "leap";
		document.getElementById("control-button").innerHTML = "Control with Mouse";
		document.getElementById("control").innerHTML = "Leap Motion";
	}
};


/*
Thoughts:
 - The interface still seems messy. I should consider
   turning some of these functions into private methods
   and instead have the library have public methods such
   as "VisualizeJacobian(function)"
 - What do math teachers want? They probably want the function
   calls to match mathematics as closely as possible.
 - I need a better idea of what the target usage is.
 - Things to teach:
  - Dot products
  - Orthogonality
  - Null Space
  - Column Space
  - Linear transformations
*/

function getRandomColor() {
    var letters = '0123456789ABCDEF'.split('');
    var color = '#';
    for (var i = 0; i < 6; i++ ) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

var foo = function() {
	$("#info_panel").toggle(false);

	$("#toggle_info_panel_button")
		.click(function(){
			manifold.animating = !manifold.animating;
			$('#info_panel').toggle('slow');
		});

	$("#viewport").toggle(false);

	$("#toggle_graph_button")
		.click(function(){
			manifold.animating = !manifold.animating;
			$('#viewport').toggle('slow');
			$('#viewport').toggleClass('active');
		});

	$(".fancy_button")
		.click(function(){
			$(this).toggleClass("selected");
		});



	var renderer = new THREE.WebGLRenderer({alpha:true, antialias:true});
	renderer.setClearColor(0x000000, 1.0);

	//var board = manifold.board("board", window.innerWidth / 2, window.innerHeight - 10);
	var board_A = manifold.board("boards", window.innerWidth, window.innerHeight, 0.000, 0.15, 0.330, 0.7, renderer, 2);
	var board_B = manifold.board("boards", window.innerWidth, window.innerHeight, 0.335, 0.15, 0.330, 0.7, renderer, 2);
	var board_C = manifold.board("boards", window.innerWidth, window.innerHeight, 0.670, 0.15, 0.330, 0.7, renderer);

	var space_A = manifold.space2(board_A, new THREE.Vector3(0,0,0), "axes", "A");
	var space_B = manifold.space3(board_B, new THREE.Vector3(0,0,0), "axes", "B");
	var space_C = manifold.space3(board_C, new THREE.Vector3(0,0,0), "axes", "C");

	var controlPoint2D = manifold.controlPoint(board_A, space_A, 2, "x");

	var tangentSpace2D = manifold.createTangentSpace(space_A, controlPoint2D);
	var basicBasis2D = manifold.addUnitBasis(2, tangentSpace2D);

	// var controlPoint = manifold.controlPoint(board_C, space_C, 3, "y");

	/*
	// Add a surface that is mapped through the function
	var surface = manifold.surface("cube", space_C);
	manifold.controlSurfacePositionWithCursor(surface);
	var surface2 = manifold.image(spherical, surface, space_B);
	// manifold.controlSurfacePositionWithControlPoint(surface, controlPoint);
	*/

	//var tangentSpace = manifold.createTangentSpace(space_C, controlPoint);
	//var basicBasis = manifold.addUnitBasis(3, tangentSpace);

	var f = manifold.mathFunction(squiggle_2, "f");

	// How can I make Jacobian operations automatic?
	var D_Spherical = manifold.approximateJacobian(f, 0.0001);
	var jacobianMatrixDisplay = manifold.showJacobian(D_Spherical, controlPoint2D, 2);
	var transformedTangentSpace = manifold.warpTangentSpaceWithJacobian(tangentSpace2D, space_B, D_Spherical, f, controlPoint2D);
	var g = manifold.mathFunction(donut, "g");
	var controlPointImage = manifold.imageOfControlPoint(controlPoint2D, f, space_B);
	var controlPointImage2 = manifold.imageOfControlPoint(controlPointImage, g, space_C);


	var connection = manifold.metaConnection(controlPoint2D, board_A, controlPointImage, board_B);
	var connection = manifold.metaConnection(controlPointImage, board_B, controlPointImage2, board_C);

	var D_spherical2 = manifold.approximateJacobian(g, 0.0001);
	var transformedTangentSpace2 = manifold.warpTangentSpaceWithJacobian(transformedTangentSpace, space_C, D_spherical2, g, controlPointImage);

	var sneakyGridLines = manifold.nearbyGridLines(space_A, controlPoint2D, 2, 0.4, 12);
	var warpyGridLines = manifold.image(f, sneakyGridLines, space_B, true, board_A, board_B);
	var warpyGridLines2 = manifold.image(g, warpyGridLines, space_C, true, board_B, board_C);

	/*
	var funControlPoint = manifold.controlPoint(board_B, space_B, 3, "y", new THREE.Vector3(0, 0, 0));

	var x_column = manifold.controlPoint(board_C, space_C, 3, "p", new THREE.Vector3(1, 0, 0));
	var y_column = manifold.controlPoint(board_C, space_C, 3, "q", new THREE.Vector3(0, 1, 0));
	var z_column = manifold.controlPoint(board_C, space_C, 3, "r", new THREE.Vector3(0, 0, 1));

	var funBasis = manifold.addUnitBasis(3, space_B);

	var transformation = manifold.controlledLinearTransformation(x_column, y_column, z_column, "M");

	var gridLines = manifold.nearbyGridLines(space_B, funControlPoint, 3, 1.0, 3);
	var stretchedGridLines = manifold.image(transformation, gridLines, space_C, true, board_B, board_C);

	var D_transformation = manifold.approximateJacobian(transformation, 0.0001);
	var transformedTangentSpace = manifold.warpTangentSpaceWithJacobian(funBasis, space_C, D_transformation, transformation, funControlPoint);

	*/

	manifold.render();
};