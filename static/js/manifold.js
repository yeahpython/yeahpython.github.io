/*
.-------------.
| manifold.js |
'-------------'
Explain multivariable calculus in the browser!

The latest version of this project may be found at github.com/yeahpython/manifold
*/

console.log(window);
console.log(this);

(function(manifold, $, THREE, undefined){
	var xAxisMaterial = new THREE.LineBasicMaterial({
		color: 0xff0000,
		linewidth: 2
	});

	var yAxisMaterial = new THREE.LineBasicMaterial({
		color: 0x00ff00,
		linewidth: 2
	});

	var zAxisMaterial = new THREE.LineBasicMaterial({
		color: 0x0000ff,
		linewidth: 2
	});

	var linematerial = new THREE.LineDashedMaterial({
		color: 0xffffff,
		dashSize: 0.2,
		gapSize: 0.2,
		linewidth: 1,
		scale: 1
	});

	var parallelogramLineMaterial = new THREE.LineBasicMaterial({
		color: 0x444444,
		linewidth: 2
	});

	var surfaceMaterial = new THREE.MeshBasicMaterial({
		color:0xffffff,
		transparent:true,
		opacity:0.1
	});

	/*var controlPointMaterial = new THREE.MeshBasicMaterial({
		color:0xffffff,
		transparent:true,
		opacity:0.3,
		blending: THREE.AdditiveBlending,
		depthWrite:false
	});*/

	var gridMaterial = new THREE.LineBasicMaterial({
		color: 0xaaaaaa,
		vertexColors: THREE.VertexColors,
		transparent: true,
		blending: THREE.AdditiveBlending
	});

	var pointCloudMaterial = new THREE.PointCloudMaterial({
		color:0x000000,
		size:0.3
	});



	var boards = [];

	var cursorSurface = (function() {
		cursorSurface = new THREE.SphereGeometry(6,100,100);
		var min = new THREE.Vector3(-1.5,-1.5,-1.5);
		var max = new THREE.Vector3(1.5,1.5,1.5);
		for (var i = 0; i < cursorSurface.vertices.length; i++) {
			cursorSurface.vertices[i] = cursorSurface.vertices[i].clamp(min,max);
		}
		return cursorSurface;
	})();

	// inputs
	manifold.cursorControl = "mouse";
	// values range from -1 to 1
	var mouse = {x: 0, y: 0};
	manifold.controlPoints = [];
	var mouse3d = new THREE.Vector3(0,0,0);
	var cursor = new THREE.Vector3(0,0,0);

	var leapCursor3d = new THREE.Vector3(0,0,0);

	manifold.animating = true;
	var updateRules = [
	{
		update:function() {
			get3DCursor();
		}
	}];

	// This is used for svg animations such as the lines that span 3D scenes.
	var snap;
	$(document).ready(function(){
		snap = Snap("#svg_annotation");
	});

	function getScreenPositionFromBoard(vec, board, constrain) {
		var vector = new THREE.Vector3().copy(vec).project(board.camera);
		vector.x = (vector.x + 1) / 2;
        vector.y = -(vector.y - 1) / 2;
        if (constrain === true) {
        	vector.clampScalar(0, 1);
        } else if (constrain === "2D") {
        	// This is supposed to not clamp the z values.
        	vector.clamp(new THREE.Vector3(0, 0, -1000), new THREE.Vector3(1, 1, 1000));
        }

        // vector.x and vector.y are now relative locations in the view.
        vector.x *= board.view.width;
        vector.x += board.view.left;

        vector.y *= board.view.height;
        vector.y += board.view.bottom;


        vector.x *= board.renderer.domElement.width;
        vector.y *= board.renderer.domElement.height;
		return vector;
	}

	// Draws a line from the position of object_1 to the position of object_2.
	// object_1 and object_2 don't need to be in the same three-dimensional scene.
	manifold.metaConnection = function(object_1, board_1, object_2, board_2) {
		var c_1 = snap.circle(100,100,3);
		c_1.attr("fill", "white");

		var c_2 = snap.circle(100,100,3);
		c_2.attr("fill", "white");

		//var l = snap.line(50,50,100,100);
		//l.attr("stroke", "white");

		var l_2 = snap.path("M 100 200 C 100 199 200 199 400 200");
		l_2.attr("stroke", "white");
		l_2.attr("fill", "transparent");

		var duration = 0;
		var x_1, y_1, x_1_a, y_1_a, x_2, y_2, x_2_a, y_2_a;
		updateRules.push({
			update:function(){
				var vector_1 = getScreenPositionFromBoard(object_1.position, board_1, "2D");
				var vector_2 = getScreenPositionFromBoard(object_2.position, board_2, "2D");
				// ignore if not in view.
				var point_1_ok = ((vector_1.z >= 0) && (vector_1.z <= 1)) || (board_1.dimensions == 2);
				var point_2_ok = ((vector_2.z >= 0) && (vector_2.z <= 1)) || (board_2.dimensions == 2);

				var endpoint_1 = new THREE.Vector3().lerpVectors(vector_1, vector_2, 0);
				var endpoint_2 = new THREE.Vector3().lerpVectors(vector_2, vector_1, 0);

				if (point_1_ok) {
					x_1 = Math.round(endpoint_1.x);
					y_1 = Math.round(endpoint_1.y);
					x_1_a = Math.round(endpoint_1.x);
					y_1_a = Math.round(endpoint_1.y - 80);

					c_1.animate({cx : x_1, cy: y_1}, duration);
					//l.animate({x1 : endpoint_1.x, y1:endpoint_1.y}, duration);
				} else {
					// console.log("not updating connection to " + object_1.name + " because z value is " + vector_1.z);
				}
				if (point_2_ok) {
					x_2 = Math.round(endpoint_2.x);
					y_2 = Math.round(endpoint_2.y);
					x_2_a = Math.round(endpoint_2.x);
					y_2_a = Math.round(endpoint_2.y - 80);
					c_2.animate({cx : x_2, cy: y_2}, duration);
					//l.animate({x2 : endpoint_2.x, y2:endpoint_2.y}, duration);
				} else {
					// console.log("not updating connection to " + object_2.name+ " because z value is " + vector_2.z);
				}
				var target = "M " + x_1   + " " + y_1   + " C " + x_1_a + " " + y_1_a +
				             " "  + x_2_a + " " + y_2_a + " "   + x_2   + " " + y_2;
				//console.log(target);
				l_2.attr("d", target);
			}
		});
	}


	// Public Methods
	/*
	manifold.board
	--------------
	Makes a board (secretly a THREE.js scene, camera and renderer).

	Parameters:
	       id: a string indicating the DOM element where we want to put the board
	    width: width in pixels of the board
	   height: height in pixels of the board
	     left: fractional offset on left of subview that this board covers
	   bottom: fractional offset on bottom
   innerWidth: fractional width of this view
  innerHeight: fractional height of this view
	*/
	manifold.board = function(id, width, height, left, bottom, innerWidth, innerHeight, renderer, dimensions) {
		dimensions = dimensions || 3;

		var view = {
			left: left,
			bottom: bottom,
			width: innerWidth,
			height: innerHeight
		};

		var scene = new THREE.Scene();
		var camera;
		if (dimensions == 3) {
			camera = new THREE.PerspectiveCamera( 100, width / height, 0.1, 1000 );
			camera.position.setX(10);
			camera.position.setY(10);
			camera.position.setZ(10);
		} else {
			camera = new THREE.OrthographicCamera( -5, 5, 5 * height * innerHeight / width / innerWidth, -5 * height * innerHeight / width / innerWidth, 1, 100 );
			camera.position.setZ(20);
		}

		// Prepare Orbit controls
		var controls = {};

		if (dimensions == 3) {
			controls = new THREE.OrbitControls(camera);
			controls.target = new THREE.Vector3(0, 0, 0);
			controls.maxDistance = 150;
		}


		// enabled Orbit controls when a different panel is clicked.
		// although Orbit controls might be diabled again if a control point is clicked.
		document.addEventListener('mousedown', function (event) {
			var mouse_pos = getRelativeMousePositionInBoard(event.pageX, event.pageY, board);
			board.controls.enabled = (Math.abs(mouse_pos.x) < 1 && Math.abs(mouse_pos.y) < 1);
		}, false);

		// fastest
		//var renderer = new THREE.WebGLRenderer();

		// fast
		//var renderer = new THREE.WebGLRenderer({alpha:true, antialias:true});

		//renderer.setClearColor(0x000000, 1.0);

		// slower, with rounded line caps
		//var renderer = new THREE.CanvasRenderer({alpha:true, antialias:true});

		renderer.setSize(width, height, true);

		var callback = function() {
			renderer.setSize( window.innerWidth, window.innerHeight );
			if (dimensions == 2) {
				camera.top = 5 * window.innerHeight * innerHeight / window.innerWidth / innerWidth;
				camera.bottom = -5 * window.innerHeight * innerHeight / window.innerWidth / innerWidth;
			}
		}

		window.addEventListener('resize', callback, false);


		var box = document.getElementById(id);
		box.appendChild( renderer.domElement );
		var board = {
			id: id,
			scene: scene,
			camera: camera,
			renderer: renderer,
			controls: controls,
			view: view,
			dimensions: dimensions
		};
		boards.push(board);
		return board;
	};

	// Adds an object representing three-dimensional space to the board.
	// Adds axes by default, although this may change.
	manifold.space3 = function(board, origin, spaceOption, name) {
		//okay for spaceOption to be undefined
		return space(3, board, origin, spaceOption, name);
	};

	manifold.space2 = function(board, origin, spaceOption, name) {
		//okay for spaceOption to be undefined
		return space(2, board, origin, spaceOption, name);
	};

	function getJacobianNameFromName (name) {
		return "d" + name;
	}

	// Returns an approximate Jacobian of function userFunc
	// so if userfunc takes an n-vector and returns a m-vector,
	// this takes an n-vector and returns an m by n matrix
	manifold.approximateJacobian = function(userFunc, epsilon) {
		// assuming 3x3 for now.
		var name = getJacobianNameFromName(userFunc.name);
		$("<div/>")
			.addClass("symbol")
			.html(name)
			.appendTo($("#description"));
		$("#description")[0].innerHTML += ": Jacobian of function " + userFunc.name + "<br>"
		return {
			getMatrixAt: function(input) {
				col1 = userFunc.transform(new THREE.Vector3(epsilon, 0, 0).add(input)).sub(userFunc.transform(input)).divideScalar(epsilon);
				col2 = userFunc.transform(new THREE.Vector3(0, epsilon, 0).add(input)).sub(userFunc.transform(input)).divideScalar(epsilon);
				col3 = userFunc.transform(new THREE.Vector3(0,0, epsilon).add(input)).sub(userFunc.transform(input)).divideScalar(epsilon);
				return new THREE.Matrix3().set(col1.x, col2.x, col3.x,
					                           col1.y, col2.y, col3.y,
					                           col1.z, col2.z, col3.z);
			},
			name: name
		};
	};

	// TODO: Make this work transitively.
	manifold.warpTangentSpaceWithJacobian = function(originalSpace, targetParentSpace, jacobian, f, controlPoint) {
		var newSpace = originalSpace.clone();
		var jacobianMatrixName = jacobian.name + "<sub>" + controlPoint.name + "</sub>"
		newSpace.name = jacobianMatrixName + "(" + originalSpace.name + ")";
		/*
		// not sure what this description really should be.

		$("<div/>")
			.addClass("symbol")
			.html(newSpace.name)
			.appendTo($("#description"));
		$("#description")[0].innerHTML += ": Tangent space at image of point " + controlPoint.name + " under " + f.name;
		$("#description")[0].innerHTML += "<br>";
		*/
		// sys.addEdge(f.name, newSpace.name);
		//sys.addEdge(controlPoint.name, newSpace.name);
		sys.addEdge(originalSpace.name, newSpace.name, {name: jacobianMatrixName});
		//sys.addEdge(targetParentSpace.name, newSpace.name);

		// CAREFUL: Setting properties like rotation and position will no longer affect the space.
		newSpace.matrixAutoUpdate = false;

		targetParentSpace.add(newSpace);
		updateRules.push({
			update: function(){
				// newSpace.position.copy(controlPoint.position);
				// copy over local transformation
				//
				// TODO: I'm pretty sure that to do this transitively this needs to be a matrix multiplication.
				var m = jacobian.getMatrixAt(controlPoint.position);
				var original_matrix = new THREE.Matrix4().copy(originalSpace.matrix);
				var apply_jacobian_matrix = new THREE.Matrix4().identity();
				for (var i = 0; i < 3; i++) {
					for (var j = 0; j < 3; j++) {
						apply_jacobian_matrix.elements[4 * i + j] = m.elements[3 * i + j];
					}
				}
				newSpace.matrix.multiplyMatrices(apply_jacobian_matrix, originalSpace.matrix); // Is this before or after?

				/*for (var i = 0; i < 3; i++) {
					for (var j = 0; j < 3; j++) {
						newSpace.matrix.elements[4 * i + j] = m.elements[3 * i + j];
					}
				}*/
				newSpace.matrix.setPosition(f.transform(controlPoint.position));

				//newSpace.rotation.setFromRotationMatrix()
				newSpace.matrixWorldNeedsUpdate = true;
			}
		});
		return newSpace;
	}

	/*
	  basis: the original basis that you want to transform
	  space: the space in which you place the transformed basis
	  jacobian: a function that takes 3D points as input and returns 3x3 matrices

	  currently assumes that the jacobian should be determined by the cursor position by default,
	  although odds are that at some point this will become an incorrect assumption.
	*/
	manifold.transformBasisWithJacobian = function(basis, space, jacobian, controlPoint) {
		var newBasis = manifold.addUnitBasis(3, space);
		for (var i = 0; i < basis.children.length; i++) {
			newBasis.children[i].geometry.dynamic = true;
		}
		updateRules.push({
			update:function(){
				var m = jacobian.getMatrixAt(controlPoint.position);
				for (var i = 0; i < basis.children.length; i++) {
					for (var j = 0; j < newBasis.children[i].geometry.vertices.length; j++) {
						newBasis.children[i].geometry.vertices[j].copy(basis.children[i].geometry.vertices[j]);
						newBasis.children[i].geometry.vertices[j].applyMatrix3(m);
					}
					newBasis.children[i].geometry.verticesNeedUpdate = true;
				}
			}
		});
		return newBasis;
	};

	// Shows the matrix of values in the jacobian.
	manifold.showJacobian = function(jacobian, controlPoint, source_dimensions, dest_dimensions) {
		source_dimensions = source_dimensions || 3;
		dest_dimensions = dest_dimensions || 3;
		$("<div/>")
			.addClass("symbol")
			.html(jacobian.name + "<sub>" + controlPoint.name + "</sub>")
			.appendTo($("#description"));
		var explanation = $("<div/>")
			.addClass("symbol_explanation")
			.html(": Jacobian evaluated at " + controlPoint.name)
			.appendTo($("#description"));
		$("#description").append("<br>");
		//$(".symbol_explanation")[0].innerHTML += ": jacobian of some function evaluated at " + controlPoint.name + "<br>";
		var matrixBox = $("<div/>")
			.addClass("jacobian_matrix")
			.appendTo(explanation);
		var brackets = $("<div/>")
			.addClass("matrix_brackets")
			.appendTo(matrixBox);
		var column_ids = [];
		for (var i = 0; i < source_dimensions; i++) {
			var id = jacobian.name + "_at_" + controlPoint.name + "_col_" + i;
			column_ids.push(id);
			var column = $("<div/>")
				.addClass("matrix_column")
				.attr("id", id)
				.appendTo(brackets);
		}
		updateRules.push({
			update: function() {
				var M = jacobian.getMatrixAt(controlPoint.position).toArray();
				for (var i = 0; i < source_dimensions; i++) {
					var column_contents = "";
					for (var j = 0; j < dest_dimensions; j++) {
						column_contents += M[i * 3 + j].toFixed(2) + "<br>";
					}
					$("#" + column_ids[i]).html(column_contents);
				}
			}
		});
	}

	// Utility function for creating surfaces with excessively many polygons
	manifold.surface = function(type, space) {
		if (type == "cube") {
			// make a cube that moves around in the space according to user input
			var mesh = new THREE.Mesh(createCursorSurface(), surfaceMaterial);
			space.add(mesh);
			return mesh;
		} else {
			throw "Unrecognized surface type";
		}
	};

	// Create the image of object under userFunc in space
	manifold.image = function(userFunc, object, space, copyColors, oldBoard, newBoard) {
		var mesh = object.clone();
		mesh.geometry = object.geometry.clone();
		space.add(mesh);
		mesh.geometry.dynamic = true;

		$("<div/>")
			.addClass("symbol")
			.html(userFunc.name)
			.appendTo($("#description"));
		$("#description")[0].innerHTML += ": " + object.parent.name + " ->" + space.name + "<br>";

		// code for adding bigass function labels between the rendered scenes.
		/*var left = Math.max(oldBoard.view.left, newBoard.view.left);
		var width = Math.min(oldBoard.view.left + oldBoard.view.width, newBoard.view.left + newBoard.view.width) - left;
		var bottom = Math.max(oldBoard.view.bottom, newBoard.view.bottom);
		var height = Math.min(oldBoard.view.bottom + oldBoard.view.height, newBoard.view.bottom + newBoard.view.height) - bottom;
		var box = $("<div/>")
			.css({
				position: "absolute",
				"font-size" : "50px",
				"text-align":"center",
				display:"table",
				//border:"solid 1px red",
				left: oldBoard.renderer.domElement.width * (left + width / 2) - 50 + "px",
				top: oldBoard.renderer.domElement.height * (1 - (bottom + height / 2)) - 50  + "px",
				width: "100px",
				height: "100px",
				"color":"white",
			})
			.appendTo($("body"));
		$("<div/>")
			.css({
				"display": "table-cell",
				"vertical-align": "middle",
			})
			.html(userFunc.name)
			.appendTo(box);*/

		sys.addEdge(object.parent.name, space.name, {name: userFunc.name});

		updateRules.push({
			update:function(){
				for (var i = 0; i < object.geometry.vertices.length; i++) {
					mesh.geometry.vertices[i] = userFunc.transform(object.geometry.vertices[i]);
				}
				mesh.geometry.verticesNeedUpdate = true;
			}
		});
		if (copyColors) {
			updateRules.push({
			update:function(){
				for (var i = 0; i < object.geometry.vertices.length; i++) {
					mesh.geometry.colors[i] = object.geometry.colors[i];
				}
				mesh.geometry.colorsNeedUpdate = true;
			}
		});
		}
		return mesh;
	};


	manifold.mathFunction = function(f, name) {
		/*
		// don't add description until it's used...

		$("<div/>")
			.addClass("symbol")
			.html(name)
			.appendTo($("#description"));
		$("#description")[0].innerHTML += ": Function<br>";
		*/
		return {
			transform: f,
			name: name
		};
	}


	manifold.translateBasisWithFunction = function(basis, space, userFunc) {
		var basisCopy = basis.clone();
		basisCopy.position = new THREE.Vector3();
		space.add(basisCopy);

		updateRules.push({
			update:function(){
				basisCopy.position.copy(userFunc.transform(cursor));
			}
		});
		return basisCopy;
	};

	var kHideControlPoint = false;
	var kUseSmallControlPoint = true;
	var kUseBigClickSurface = false;
	manifold.controlPoint = function(board, space, dimensions, name, initialPosition, interactive) {
		if (interactive === undefined) {
			interactive = true;
		}
		$("<div/>")
			.addClass("symbol")
			.html(name)
			.attr("id", "point_" + name)
			.appendTo($("#description"));
		$("#description")[0].innerHTML += ": Point in " + space.name + "<br>";
		dimensions = dimensions || 3;
		var cursorSurface, controlPointMaterial;

		var controlPointColor = interactive ? 0xffffff : 0x333333;

		var kUnselectedOpacity = 0.3;
		if (kUseSmallControlPoint) {
			cursorSurface = new THREE.SphereGeometry(0.1, 100, 100);

			controlPointMaterial = new THREE.MeshBasicMaterial({
				color: controlPointColor,
				transparent: true,
				opacity: kUnselectedOpacity,
				blending: THREE.AdditiveBlending,
				depthWrite: false
			});
		} else {
			cursorSurface = new THREE.SphereGeometry(2.5, 100, 100);

			controlPointMaterial = new THREE.MeshBasicMaterial({
				color: controlPointColor,
				transparent: true,
				opacity: kUnselectedOpacity,
				blending: THREE.AdditiveBlending,
				depthWrite: false
			});
		}
		var funMesh = new THREE.Mesh(cursorSurface, controlPointMaterial);

		var clickSurface;
		if (kUseBigClickSurface){
			clickSurface = new THREE.SphereGeometry(2.5, 100, 100);
		} else {
			clickSurface = new THREE.SphereGeometry(0.1, 100, 100);
		}

		var clickMaterial = new THREE.MeshBasicMaterial({
			color:0xffffff,
			transparent:true,
			opacity:0,
			//blending: THREE.AdditiveBlending,
			depthWrite:false
		});

		var clickMesh = new THREE.Mesh(clickSurface, clickMaterial);

		funMesh.add(clickMesh);
		clickMesh.position.set(0,0,0);

		space.add(funMesh);
		if (initialPosition) {
			funMesh.position.copy(initialPosition);
		} else {
			if (dimensions == 3) {
				funMesh.position.set(Math.random(), Math.random(), Math.random());
			} else if (dimensions == 2) {
				funMesh.position.set(Math.random(), Math.random(), 0);
			}
		}
		manifold.controlPoints.push(funMesh);

		var raycaster = new THREE.Raycaster();

		var selection = null;
		var plane = new THREE.Mesh(
			new THREE.PlaneBufferGeometry(500, 500, 8, 8),
			new THREE.MeshBasicMaterial({color: 0x0000ff}));
		plane.material.transparent = true;
		plane.material.opacity = 0.3;
		plane.visible = false;
		space.add(plane);
		var offset = new THREE.Vector3();

		// Allows you to select objects and possibly drag them around
		if (interactive) {
			document.addEventListener('mousedown', function (event) {
				var mouse_pos = getRelativeMousePositionInBoard(event.pageX, event.pageY, board);
				mouse.x = mouse_pos.x;
				mouse.y = mouse_pos.y;
				if (Math.abs(mouse_pos.x) < 1 && Math.abs(mouse_pos.y) < 1 && manifold.animating) {
					space.updateMatrixWorld();
					var intersects = raycaster.intersectObject( clickMesh);
					if (intersects.length > 0) {
						board.controls.enabled = false;
						selection = funMesh;
						selection.material.color.set(0x00ff00);
						$("#point_" + name).css("color", "green");
						var plane_intersects = raycaster.intersectObject(plane);
						//offset.copy(plane_intersects[0].point).sub(plane.position);
						if (plane_intersects.length > 0) {
							offset.copy(selection.position);
							offset.sub(plane_intersects[0].point);
						} else {
							console.log("error, raycaster can't hit plane! Maybe the plane" +
								" is the wrong size or facing the wrong direction.");
							console.log(raycaster.ray.origin);
							console.log(raycaster.ray.direction);
							console.log(plane);
						}
					}
				}
			}, false);

			// Moves selected object if there is one, and does highlighting
			document.addEventListener('mousemove', function (event) {
				// code adapted from this tutorial for dragging and dropping objects:
				// https://www.script-tutorials.com/webgl-with-three-js-lesson-10/
				event.preventDefault();
				var mouse_pos = getRelativeMousePositionInBoard(event.pageX, event.pageY, board);

				// Get 3D vector from 3D mouse position using 'unproject' function

				var vector = new THREE.Vector3(mouse_pos.x, mouse_pos.y, 1);
				vector.clampScalar(-1, 1);
				vector.unproject(board.camera);

				// Set the raycaster position
				if (dimensions == 3) {
					raycaster.set(board.camera.position, vector.sub( board.camera.position ).normalize());
				} else {
					raycaster.set(vector, new THREE.Vector3(0,0,1));
				}
				if (selection) {
					// Check the position where the plane is intersected
					//
					// TODO: contrain mouse position to board and redo raycast.
					//
					var intersects = raycaster.intersectObject(plane);
					// Reposition the object based on the intersection point with the plane
					// selection.position.copy(intersects[0].point.sub(offset));
					selection.position.copy(intersects[0].point.add(offset));
				} else {
					// funMesh.material.color.set(0xff0000);
					// funMesh.material.opacity = 0;
					// Update position of the plane if need
					var object_intersects = raycaster.intersectObject(clickMesh);
					if (object_intersects.length > 0) {
						if (object_intersects[0].object !== clickMesh) {
							throw "Unexpected collision";
						}
						funMesh.material.color.set(0xffff00);
						$("#point_" + name).css("color", "yellow");
						funMesh.material.opacity = 0.6;
						plane.position.copy(funMesh.position);
						if (dimensions == 2) {
							plane.position.setZ(0);
						}
						// console.log(plane.position);

						//plane.position.setFromMatrixPosition( object_intersects[0].object.matrixWorld );
						// console.log(plane.position);
						if (dimensions == 2) {
							// no looking required because angle is fixed.
							plane.lookAt(new THREE.Vector3(0,0,-1).add(plane.position));
						} else {
							plane.lookAt(board.camera.position);
						}
					} else {
						funMesh.material.color.set(controlPointColor);
						funMesh.material.opacity = kUnselectedOpacity;
						$("#point_" + name).css("color", "");
						if (kHideControlPoint) {
							funMesh.material.color.set(0xff0000);
							funMesh.material.opacity = 0;
						}
					}
				}

			}, false);
			document.addEventListener('mouseup', function (e) {
				for (var i = 0; i < boards.length; i++) {
					boards[i].controls.enabled = true;
				}
				selection = null;
			}, false);
		}
		funMesh.name = name;
		return funMesh;
	};

	manifold.imageOfControlPoint = function(controlPoint, func, space) {
		var cursorSurface = new THREE.SphereGeometry(0.1, 100, 100);
		var inertControlPointMaterial = new THREE.MeshBasicMaterial({
			color:0xffffff,
			blending: THREE.AdditiveBlending,
			depthWrite:false
		});
		//var funMesh = new THREE.Mesh(cursorSurface, controlPointMaterial);
		var newControlPoint = new THREE.Mesh(cursorSurface, inertControlPointMaterial);
		space.add(newControlPoint);
		newControlPoint.name = func.name + "(" + controlPoint.name + ")";
		updateRules.push({
			update:function(){
				newControlPoint.position.copy(func.transform(controlPoint.position));
			}
		});
		return newControlPoint;
	};

	// controlPoint should be an Object3D with a position where
	// we want to center the gridlines.
	manifold.nearbyGridLines = function(space, controlPoint, dimensions, gridSize, r) {
		dimensions = dimensions || 3;
		var gridLines = new THREE.Geometry();
		r = r || 3;
		gridSize = gridSize || 1.0;
		var cuts = 10;
		var step = 1 / cuts;
		k_m = (dimensions == 2) ? 1 : r;

		var bright_radius = gridSize * r / 2;

		for (var i = 0; i < r; i++) {
			for (var j = 0; j < r; j++) {
				for (var k = 0; k < k_m; k++) {
					for (var s = 0; s < cuts; s++) {
						gridLines.vertices.push(
							new THREE.Vector3(i+s*step, j, k).multiplyScalar(gridSize),
							new THREE.Vector3(i+(s+1)*step, j, k).multiplyScalar(gridSize),
							new THREE.Vector3(i, j+s*step, k).multiplyScalar(gridSize),
							new THREE.Vector3(i, j+(s+1)*step, k).multiplyScalar(gridSize));
						if (dimensions == 3) {
							gridLines.vertices.push(
								new THREE.Vector3(i, j, k+s*step).multiplyScalar(gridSize),
								new THREE.Vector3(i, j, k+(s+1)*step).multiplyScalar(gridSize));
						}
					}
				}
			}
		}


		var gridMesh = new THREE.Line( gridLines, gridMaterial, THREE.LinePieces);
		gridMesh.geometry.dynamic = true;

		space.add(gridMesh);

		updateRules.push({
			update: function() {
				var f = gridSize * r;
				// Move each line segment to the position nearest to the controlPoint
				// with the constraint that the line segment is only allowed to
				// occupy a lattice of locations
				for (var i = 0; i < gridMesh.geometry.vertices.length; i+=2) {


					var motion = new THREE.Vector3(0,0,0).copy(controlPoint.position).sub(gridMesh.geometry.vertices[i]);
					// var multiplying_factor = 0.5 + 0.5 * Math.sin(-3 * motion.length() + 0.002 * new Date().getTime());
					var t = Math.max(0, 1 - motion.length() / bright_radius);
					t = Math.min(1, t);
					// t *= multiplying_factor;
					var color = new THREE.Color( 0xffffff );
					color.setRGB(t,t,t);
					gridMesh.geometry.colors[i] = color;


					var motion_2 = new THREE.Vector3(0,0,0).copy(controlPoint.position).sub(gridMesh.geometry.vertices[i+1]);
					var t_2 = Math.max(0, 1 - motion_2.length() / bright_radius );
					t_2 = Math.min(1, t_2);
					// t_2 *= multiplying_factor;
					var color_2 = new THREE.Color( 0xffffff );
					color_2.setRGB(t_2,t_2,t_2);
					gridMesh.geometry.colors[i+1] = color_2;


					motion.divideScalar(f);
					// snap movement to the nearest multiple of 2m + 1
					motion.x = Math.round(motion.x);
					motion.y = Math.round(motion.y);
					motion.z = Math.round(motion.z);
					motion.multiplyScalar(f);
					gridMesh.geometry.vertices[i].add(motion);
					gridMesh.geometry.vertices[i+1].add(motion);

				}
				gridMesh.geometry.verticesNeedUpdate = true;
				gridMesh.geometry.colorsNeedUpdate = true;
			}
		});

		return gridMesh;
	};

	manifold.addUnitBasis = function(dimensions, space) {
		if (dimensions != 3 && dimensions != 2) {
			throw "Not dealing with less than three dimensions at the moment";
		}
		/*
		$("<div/>")
			.addClass("symbol")
			.appendTo($("#description"));
		$("#description")[0].innerHTML += ": " + dimensions + "-dimensional basis in " + space.name + "<br>"
		*/
		var basisLength = 1.0;

		var basis = new THREE.Object3D();
		space.add(basis);

		var xUnit = new THREE.Geometry();
		xUnit.vertices.push(
			new THREE.Vector3( 0, 0, 0 ),
			new THREE.Vector3( basisLength, 0, 0 ));
		basis.add(new THREE.Line( xUnit, xAxisMaterial, THREE.LinePieces));

		var yUnit = new THREE.Geometry();
		yUnit.vertices.push(
			new THREE.Vector3( 0, 0, 0 ),
			new THREE.Vector3( 0, basisLength, 0 ));
		basis.add(new THREE.Line( yUnit, yAxisMaterial, THREE.LinePieces));

		if (dimensions == 3) {
			var zUnit = new THREE.Geometry();
			zUnit.vertices.push(
				new THREE.Vector3( 0, 0, 0 ),
				new THREE.Vector3( 0, 0, basisLength ));
			basis.add(new THREE.Line( zUnit, zAxisMaterial, THREE.LinePieces));
		}
		/* basis.add(i);
		basis.add(j);
		basis.add(k); */

		var addExtraLines = true;
		if (addExtraLines) {
			var extraLines = new THREE.Geometry();
			var b = basisLength;
			extraLines.vertices.push(
				new THREE.Vector3(b, 0, 0),
				new THREE.Vector3(b, b, 0),
				new THREE.Vector3(0, b, 0),
				new THREE.Vector3(b, b, 0));
			if (dimensions == 3) {
				extraLines.vertices.push(
					new THREE.Vector3(b, 0, 0),
					new THREE.Vector3(b, 0, b),
					new THREE.Vector3(0, b, 0),
					new THREE.Vector3(0, b, b),
					new THREE.Vector3(0, 0, b),
					new THREE.Vector3(b, 0, b),
					new THREE.Vector3(0, 0, b),
					new THREE.Vector3(0, b, b),
					new THREE.Vector3(0, b, b),
					new THREE.Vector3(b, b, b),
					new THREE.Vector3(b, 0, b),
					new THREE.Vector3(b, b, b),
					new THREE.Vector3(b, b, 0),
					new THREE.Vector3(b, b, b)
					);
			}
			var additionalLines = new THREE.Line(extraLines, parallelogramLineMaterial, THREE.LinePieces);

			basis.add(additionalLines);
		}

		return basis;
	};

	// Draws a line between two spaces, with text showing label over it.
	manifold.arrow = function(source, target, label) {
		// Not written yet.
	};

	var colors = [0x000000, 0x111111, 0x000000];

	manifold.render = function() {
		// lazy (as a programmer) solution for turning off animations.
		// frames keep on going but I don't do anythin about it.
		if (manifold.animating) {
			updateAll();
			var inputX = cursor.x;
			var inputY = cursor.y;
			// update the picking ray with the camera and mouse position
			for (var i = 0; i < boards.length; i++) {
				var left = Math.floor(boards[i].renderer.domElement.width * boards[i].view.left);
				var bottom = Math.floor(boards[i].renderer.domElement.height * boards[i].view.bottom);
				var width = Math.floor(boards[i].renderer.domElement.width * boards[i].view.width);
				var height = Math.floor(boards[i].renderer.domElement.height * boards[i].view.height);
				boards[i].renderer.setViewport( left, bottom, width, height );
				boards[i].renderer.setScissor( left, bottom, width, height );
				boards[i].renderer.enableScissorTest ( true );
				boards[i].renderer.setClearColor(colors[i]);
				boards[i].renderer.render(boards[i].scene, boards[i].camera);
				boards[i].camera.aspect = width / height;
				boards[i].camera.updateProjectionMatrix();
				/*var cameraTarget = new THREE.Vector3(6 *inputX,6 * inputY, 20 );
				boards[i].camera.position.lerp(cameraTarget, 0.01);*/
				boards[i].camera.lookAt(new THREE.Vector3(0,0,0));
			}
		}
		requestAnimationFrame(manifold.render);
	};

	manifold.controlSurfacePositionWithCursor = function(surface) {
		updateRules.push(
			{
				update :
				function()
				{
					updateMeshWithInput(surface, cursor);
				}
			}
		);
	};

	manifold.getCursor = function(){
		return new THREE.Vector3(cursor);
	};

	manifold.tryToControlInputWithLeap = function() {
		document.getElementById("control").innerHTML = "Leap Motion Controller";
		manifold.cursorControl = "leap";
		Leap.loop(function (frame) {
		    if (frame.hands.length) {
		    	p = frame.hands[0].palmPosition;
				leapCursor3d.set(p[0], p[1]-100, p[2]+100).divideScalar(40);
			}
		});
	};

	manifold.tryToControlInputWithSomeControlPoint = function() {
		document.getElementById("control").innerHTML = "Control Point";
		manifold.cursorControl = "some control point";
	};

	manifold.genericPointCloud = function(space) {
		points = new THREE.Geometry();
		var m = 6;
		for (var i = -m; i <= m; i+=2) {
			for (var j = -m; j <= m; j+=2) {
				for (var k = -m; k <=m; k+=2) {
					var point = new THREE.Vector3(i,j,k);
					points.vertices.push(space.localToWorld(point));
				}
			}
		}
		var pointCloud = new THREE.PointCloud(points, pointCloudMaterial);
		space.add(pointCloud);
		return pointCloud;
	};

	manifold.pointCloudImage = function(space, pointCloud, userFunc) {
		space.updateMatrixWorld();
		var newPointCloud = new THREE.PointCloud(pointCloud.geometry.clone(), pointCloud.material);
		for (var i = 0; i < newPointCloud.geometry.vertices.length; i++) {
			newPointCloud.geometry.vertices[i] = userFunc.transform(newPointCloud.geometry.vertices[i]);
		}
		space.add(newPointCloud);
	};

	// Creates a THREE.js space as a child of a given space, with a position that follows the controlPoint at every frame.
	manifold.createTangentSpace = function(parent, controlPoint) {
		// controlPoint should be an object with a Vector3 position member.
		var space = new THREE.Object3D();
		space.name = "T<sub>" + controlPoint.name + "</sub>" + parent.name;
		//sys.addEdge(controlPoint.name, space.name);
		//sys.addEdge(controlPoint.name, parent.name);
		//sys.addEdge(parent.name, space.name);
		/*
		// Add description. But what is the description supposed to be?
		$("<div/>")
			.addClass("symbol")
			.html(space.name)
			.appendTo($("#description"));
		$("#description")[0].innerHTML += ": Tangent space of manifold "+ parent.name + " at point " + controlPoint.name + "<br>";
		*/

		parent.add(space);
		updateRules.push(
		{	update:function(){
				space.position.copy(controlPoint.position);
			}
		});
		return space;
	};

	manifold.imageOfSpace = function(userFunc, originalSpace, parent) {
		var space = new THREE.Object3D();
		parent.add(space);
		updateRules.push({update:function(){
			space.position.copy(userFunc.transform(originalSpace.position));
		}});
		return space;
	};

	document.addEventListener('mousemove', function(e){
	    // TODO: investigate this oddness
	    // var inputX = e.clientX || e.pageX;
	    // var inputY = e.clientY || e.pageY;
	    var inputX = e.clientX;
	    var inputY = e.clientY;
	    mouse.x = (inputX / $(window).width()) * 2 - 1;
		mouse.y = -(inputY / $(window).height()) * 2 + 1;
		mouse3d.set( 5*mouse.x , 5 * mouse.y, 5);
	}, false);

	// Private Methods

	/*
	Makes a space (Secretly a glorified THREE.Object3D)
	gives the space axes, and puts the space in board at the given origin
	*/
	function space(dimension, board, origin, spaceOption, name) {
		// okay for spaceOption to be undefined

		if (dimension != 3 && dimension != 2) {
			throw "Dimensions other than 3 not supported";
		}
		$("<div/>")
			.addClass("symbol")
			.attr("id", "space_"+name)
			.html(name)
			.appendTo($("#description"));
		$("#description")[0].innerHTML += ": " + dimension + "-dimensional space<br>";
		sys.addNode(name, {mass:.25})

		// Moves selected object if there is one, and does highlighting
		document.addEventListener('mousemove', function (event) {
			// code adapted from this tutorial for dragging and dropping objects:
			// https://www.script-tutorials.com/webgl-with-three-js-lesson-10/
			event.preventDefault();
			var mouse_pos = getRelativeMousePositionInBoard(event.pageX, event.pageY,  board);
			var over = (Math.abs(mouse_pos.x) < 1 && Math.abs(mouse_pos.y) < 1);
			$("#space_" + name).css("color", over ? "#eeee00": "");
		}, false);
		//$("#description")[0].innerHTML += name + ": " + dimension + "-dimensional space<br>";
		var plot = new THREE.Object3D();
		var axes = new THREE.Geometry();

		var line = undefined;
		if (spaceOption == "axes") {
			axes.vertices.push(
				new THREE.Vector3( -100, 0, 0 ),
				new THREE.Vector3( 100, 0, 0 ),
				new THREE.Vector3( 0, -100, 0 ),
				new THREE.Vector3( 0, 100, 0 ));
			if (dimension == 3) {
				axes.vertices.push(
					new THREE.Vector3( 0, 0, -100 ),
					new THREE.Vector3( 0, 0, 100 ));
			}
			axes.computeLineDistances();
			line = new THREE.Line( axes, linematerial, THREE.LinePieces);
		} else if (spaceOption == "box"){
			if (dimension == 2) {
				axes.vertices.push(
					//triple
					new THREE.Vector3( -10, -10, 0 ),
					new THREE.Vector3( 10, -10, 0 ),

					new THREE.Vector3( -10, -10, 0 ),
					new THREE.Vector3( -10, 10, 0),

					// L-shape
					new THREE.Vector3( 10, -10, 0 ),
					new THREE.Vector3( 10, 10, 0 ),

					// L-shape
					new THREE.Vector3( -10, 10, 0 ),
					new THREE.Vector3( 10, 10, 0 ));
			} else {
				axes.vertices.push(
					//triple
					new THREE.Vector3( -10, -10, -10 ),
					new THREE.Vector3( 10, -10, -10 ),

					new THREE.Vector3( -10, -10, -10 ),
					new THREE.Vector3( -10, 10, -10 ),
					new THREE.Vector3( -10, -10, -10 ),
					new THREE.Vector3( -10, -10, 10 ),

					// L-shape
					new THREE.Vector3( 10, -10, -10 ),
					new THREE.Vector3( 10, 10, -10 ),

					new THREE.Vector3( 10, -10, -10 ),
					new THREE.Vector3( 10, -10, 10 ),

					// L-shape
					new THREE.Vector3( -10, 10, -10 ),
					new THREE.Vector3( 10, 10, -10 ),

					new THREE.Vector3( -10, 10, -10 ),
					new THREE.Vector3( -10, 10, 10 ),

					// L-shape
					new THREE.Vector3( -10, -10, 10 ),
					new THREE.Vector3( 10, -10, 10 ),

					new THREE.Vector3( -10, -10, 10 ),
					new THREE.Vector3( -10, 10, 10 ),

					// triple
					new THREE.Vector3( -10, 10, 10 ),
					new THREE.Vector3( 10, 10, 10 ),

					new THREE.Vector3( 10, -10, 10 ),
					new THREE.Vector3( 10, 10, 10 ),

					new THREE.Vector3( 10, 10, -10 ),
					new THREE.Vector3( 10, 10, 10 ));
			}
			axes.computeLineDistances();
			line = new THREE.Line( axes, linematerial, THREE.LinePieces);
		} else if (spaceOption == "volume_axes") {
			for (var i = 0; i < dimension; i++) {
				var geometry = new THREE.CylinderGeometry( 1, 1, 20, 32 );
				var material = new THREE.MeshBasicMaterial( {color: 0xffff00} );
				var cylinder = new THREE.Mesh( geometry, material );
				cylinder.up.set(new THREE.Vector3(i == 0, i == 1, i == 2));
				plot.add( cylinder );
			}
		}

		board.scene.add( plot );

		if (line) {
			plot.add(line);
			plot.axes = line;
		}

		plot.position.add(origin);
		plot.name = name;
		return plot;
	}


	// Updates the meshes in the scene according to updateRules.
	// Does not sort according to dependencies. This should be okay
	// because updateRules should be added in topological order for
	// now.
	function updateAll() {
		// TODO: Detect and skip redundant updates.
		for (var i = 0; i < updateRules.length; i++) {
			updateRules[i].update();
		}
	}

	function get3DCursor(){
		if (manifold.cursorControl == "leap") {
			cursor.copy(leapCursor3d);
		} else if (manifold.cursorControl == "mouse") {
			cursor.copy(mouse3d);
		} else if (manifold.controlPoints){
			cursor.copy(manifold.controlPoints[0].position);
		} else {
			console.log("didn't know what to do to with cursorControl");
		}
	}

	function getRelativeMousePositionInBoard(pageX, pageY, board) {
		var board_position = $("#" + board.id).offset();

		var inputX = pageX - board_position.left;
		var inputY = pageY - board_position.top;

		// That is the position in the canvas. To get the position in the subwindow:
		var left = Math.floor(board.renderer.domElement.width * board.view.left);
		var bottom = Math.floor(board.renderer.domElement.height * board.view.bottom);
		var width = Math.floor(board.renderer.domElement.width * board.view.width);
		var height = Math.floor(board.renderer.domElement.height * board.view.height);

		var x = inputX - left;
		var y = inputY - (board.renderer.domElement.height - bottom - height);

		var mouseX = (x / width) * 2 - 1;
		var mouseY = -(y / height) * 2 + 1;
		return {x: mouseX, y: mouseY}
	}

	/*
	This function moves a mesh around per-vertex instead of moving the
	overall position.
	*/
	function updateMeshWithInput(mesh, vec) {
		mesh.geometry.dynamic = true;
		if (mesh.geometry.vertices.length == cursorSurface.vertices.length) {
			for (var i = 0; i < cursorSurface.vertices.length; i++) {
				mesh.geometry.vertices[i].copy(cursorSurface.vertices[i]).add(vec);
			}
		} else {
			throw "Error: Mesh has incorrect length";
		}
		mesh.geometry.verticesNeedUpdate = true;
	}

	function createCursorSurface() {
		var cursorSurface = new THREE.SphereGeometry(6,100,100);
		//var min = new THREE.Vector3(-1.5,-1.5,-1.5);
		//var max = new THREE.Vector3(1.5,1.5,1.5);
		for (var i = 0; i < cursorSurface.vertices.length; i++) {
			cursorSurface.vertices[i] = cursorSurface.vertices[i].clampScalar(-1.5,1.5);
		}
		return cursorSurface;
	}

	manifold.controlledLinearTransformation = function(x_column, y_column, z_column, name) {
		name = name || "anonymous"
		var matrix = new THREE.Matrix3();
		updateRules.push({
			update:function(){
			matrix.set(x_column.position.x, y_column.position.x, z_column.position.x,
				       x_column.position.y, y_column.position.y, z_column.position.y,
				       x_column.position.z, y_column.position.z, z_column.position.z);
		}});
		return manifold.mathFunction (function(input) {
				var vectorArray = input.toArray();
				matrix.applyToVector3Array(vectorArray);
				return new THREE.Vector3().fromArray(vectorArray);
			}, name);
	};

}(window.manifold = window.manifold || {}, jQuery, THREE));

function HTMLishToLaTeXish(input) {
	return input.replace(/<sub>/g, "_{").replace(/<\/sub>/g, "}");
}


// graph visualization with arbor.js
var sys;
(function($){

  var Renderer = function(canvas){
    var canvas = $(canvas).get(0)
    var ctx = canvas.getContext("2d");
    var particleSystem

    var that = {
      init:function(system){
        //
        // the particle system will call the init function once, right before the
        // first frame is to be drawn. it's a good place to set up the canvas and
        // to pass the canvas size to the particle system
        //
        // save a reference to the particle system for use in the .redraw() loop
        particleSystem = system

        // inform the system of the screen dimensions so it can map coords for us.
        // if the canvas is ever resized, screenSize should be called again with
        // the new dimensions
        particleSystem.screenSize(canvas.width, canvas.height)
        particleSystem.screenPadding(80) // leave an extra 80px of whitespace per side

        // set up some event handlers to allow for node-dragging
        that.initMouseHandling()
      },

      redraw:function(){
      	if (!($(canvas).hasClass("active"))) {
      		return;
      	}
        //
        // redraw will be called repeatedly during the run whenever the node positions
        // change. the new positions for the nodes can be accessed by looking at the
        // .p attribute of a given node. however the p.x & p.y values are in the coordinates
        // of the particle system rather than the screen. you can either map them to
        // the screen yourself, or use the convenience iterators .eachNode (and .eachEdge)
        // which allow you to step through the actual node objects but also pass an
        // x,y point in the screen's coordinate system
        //
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight * 0.85;
        particleSystem.screenSize(canvas.width, canvas.height)
        ctx.fillStyle = "white";
        ctx.fillRect(0,0, canvas.width, canvas.height);

        particleSystem.eachEdge(function(edge, pt1, pt2){
          // edge: {source:Node, target:Node, length:#, data:{}}
          // pt1:  {x:#, y:#}  source position in screen coords
          // pt2:  {x:#, y:#}  target position in screen coords

          // draw a line from pt1 to pt2
          ctx.strokeStyle = "rgba(0, 0, 0, .333)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          var scale = 5 / Math.pow(Math.pow(pt2.x - pt1.x, 2) + Math.pow(pt2.y - pt1.y, 2), 0.5);
          ctx.moveTo(pt1.x, pt1.y);
          ctx.lineTo(pt2.x, pt2.y);
          ctx.lineTo(pt2.x + scale * (pt1.x - pt2.x + pt2.y - pt1.y), pt2.y + scale * ( pt1.y - pt2.y - pt2.x + pt1.x) );
          ctx.moveTo(pt2.x, pt2.y);
          ctx.lineTo(pt2.x + scale * (pt1.x - pt2.x - pt2.y + pt1.y), pt2.y + scale * ( pt1.y - pt2.y + pt2.x - pt1.x) );
          ctx.stroke();

          if (edge.data.name) {
            ctx.font="10px Georgia";
            ctx.fillStyle = "black";
		    ctx.fillText(HTMLishToLaTeXish(edge.data.name),(pt1.x + pt2.x)/2, (pt1.y + pt2.y)/2);
		  }
        });

        particleSystem.eachNode(function(node, pt) {
          // node: {mass:#, p:{x,y}, name:"", data:{}}
          // pt:   {x:#, y:#}  node position in screen coords

          // draw a rectangle centered at pt
          var w = 2
          ctx.fillStyle = (node.data.alone) ? "orange" : "black"
          ctx.fillRect(pt.x-w/2, pt.y-w/2, w,w)

          ctx.font="10px";
		  ctx.fillText(HTMLishToLaTeXish(node.name),pt.x + 10,pt.y + 10);
        })
      },

      initMouseHandling:function(){
        // no-nonsense drag and drop (thanks springy.js)


        var dragged = null;

        // set up a handler object that will initially listen for mousedowns then
        // for moves and mouseups while dragging
        var handler = {
          clicked:function(e){
            var pos = $(canvas).offset();
            _mouseP = arbor.Point(e.pageX-pos.left, e.pageY-pos.top)
            dragged = particleSystem.nearest(_mouseP);

            if (dragged && dragged.node !== null){
              // while we're dragging, don't let physics move the node
              dragged.node.fixed = true
            }

            $(canvas).bind('mousemove', handler.dragged)
            $(window).bind('mouseup', handler.dropped)

            return false
          },
          dragged:function(e){
            var pos = $(canvas).offset();
            var s = arbor.Point(e.pageX-pos.left, e.pageY-pos.top)

            if (dragged && dragged.node !== null){
              var p = particleSystem.fromScreen(s)
              dragged.node.p = p
            }

            return false
          },

          dropped:function(e){
            if (dragged===null || dragged.node===undefined) return
            if (dragged.node !== null) dragged.node.fixed = false
            dragged.node.tempMass = 1000
            dragged = null
            $(canvas).unbind('mousemove', handler.dragged)
            $(window).unbind('mouseup', handler.dropped)
            _mouseP = null
            return false
          }
        }

        // start listening
        $(canvas).mousedown(handler.clicked);

      },

    }
    return that
  }

  $(document).ready(function(){
    sys = arbor.ParticleSystem(1000, 600, 0.5) // create the system with sensible repulsion/stiffness/friction
    sys.parameters({gravity:true}) // use center-gravity to make the graph settle nicely (ymmv)
    sys.renderer = Renderer("#viewport") // our newly created renderer will have its .init() method called shortly by sys...
  })

})(this.jQuery)
