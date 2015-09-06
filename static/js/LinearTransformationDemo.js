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
			if ($('#viewport').hasClass('active')) {
				$('#debug').html("<br><br><br><br><br><br><br>This is glitchy, so you may need to click around before you see anything.");
			} else {
				$('#debug').html("");
			}
		});

	$(".fancy_button")
		.click(function(){
			$(this).toggleClass("selected");
		});



	var renderer = new THREE.WebGLRenderer({alpha:true, antialias:true});
	renderer.setClearColor(0x000000, 1.0);

	var board_A = manifold.board("boards", window.innerWidth, window.innerHeight, 0, 0.15, 0.5, 0.7, renderer);
	var board_B = manifold.board("boards", window.innerWidth, window.innerHeight, 0.5, 0.15, 0.5, 0.7, renderer);

	var space_A = manifold.space3(board_A, new THREE.Vector3(0,0,0), "axes", "A");
	var space_B = manifold.space3(board_B, new THREE.Vector3(0,0,0), "axes", "B");

	var funControlPoint = manifold.controlPoint(board_A, space_A, 3, "p", new THREE.Vector3(0, 0, 0), false);

	var x_column = manifold.controlPoint(board_B, space_B, 3, "x", new THREE.Vector3(1, 0, 0));
	var y_column = manifold.controlPoint(board_B, space_B, 3, "y", new THREE.Vector3(0, 1, 0));
	var z_column = manifold.controlPoint(board_B, space_B, 3, "z", new THREE.Vector3(0, 0, 1));

	var funBasis = manifold.addUnitBasis(3, space_A);

	var transformation = manifold.controlledLinearTransformation(x_column, y_column, z_column, "M");

	var gridLines = manifold.nearbyGridLines(space_A, funControlPoint, 3, 1.0, 4);
	var stretchedGridLines = manifold.image(transformation, gridLines, space_B, true, board_A, board_B);

	var D_transformation = manifold.approximateJacobian(transformation, 0.0001);
	var jacobianMatrixDisplay = manifold.showJacobian(D_transformation, funControlPoint, 3, 3);
	var transformedTangentSpace = manifold.warpTangentSpaceWithJacobian(funBasis, space_B, D_transformation, transformation, funControlPoint);



	manifold.render();
};