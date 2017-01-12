

var initialize = function () {
	document.getElementById("3D").appendChild(renderer.domElement );
}


var constructPlot = function(x,y,z) {
	var plot = new THREE.Object3D();
	axes = new THREE.Geometry();
	axes.vertices.push(
		new THREE.Vector3( -10, 0, 0 ),
		new THREE.Vector3( 10, 0, 0 ),
		new THREE.Vector3( 0, -10, 0 ),
		new THREE.Vector3( 0, 10, 0 ),
		new THREE.Vector3( 0, 0, -10 ),
		new THREE.Vector3( 0, 0, 10 )
	);
	var line = new THREE.Line( axes, linematerial, THREE.LinePieces);
	scene.add( line );
	scene.add( plot );
	THREE.SceneUtils.attach(line, scene, plot);
	plot.translateX(x);
	plot.translateY(y);
	plot.translateZ(z);
	return plot;
}

var myFunction = function(vector) {
	if (functionPlot == 0) {
		return new THREE.Vector3(vector.x, vector.y, vector.z + Math.sin(vector.y));
	} else {
		return spherical(vector);
	}
}

var spherical = function(vector) {
	z = vector.z * 0.4 + 5;
	x = vector.x * 0.1;
	y = vector.y * 0.1;
	return new THREE.Vector3(z*Math.sin(x), z *Math.cos(x) * Math.sin(y), z*Math.cos(x) * Math.cos(y))
}


var fShow33 = function(callback, left, right) {
	var domainPoints = new THREE.Geometry();
	var rangePoints = new THREE.Geometry();
	left.updateMatrixWorld();
	right.updateMatrixWorld();
	var m = 5.5;
	for (var i = -m; i <= m; i+=2) {
		for (var j = -m; j <= m; j+=2) {
			for (var k = -m; k <=m; k+=2) {
				var domainPoint = new THREE.Vector3(i,j,k);
				var rangePoint = callback(domainPoint);

				domainPoints.vertices.push(left.localToWorld(domainPoint));

				rangePoints.vertices.push(right.localToWorld(rangePoint));
			}
		}
	}
	var domainMaterial = new THREE.PointCloudMaterial({color:0x000000, size:0.3});
	scene.add(new THREE.PointCloud(domainPoints, domainMaterial));

	var rangeMaterial = new THREE.PointCloudMaterial({color:0x000000, size:0.3});
	scene.add(new THREE.PointCloud(rangePoints, rangeMaterial));
	//THREE.SceneUtils.attach(domainPoints, scene, left);
	//THREE.SceneUtils.attach(rangePoints, scene, right);


	return {domain:domainPoints, range:rangePoints};
}

var bubbleSample = function(callback, left, right) {
	var domainSurface = new THREE.SphereGeometry(5, 32, 32);
	//domainSurface.applyMatrix(new THREE.Matrix4().makeTranslation(left.position.x, left.position.y, left.position.z));
	//var material = new THREE.MeshBasicMaterial({color:0xff0000, wireframe:true});
	var material = new THREE.MeshLambertMaterial({color:0xffffff});
	var domainSphere = new THREE.Mesh( domainSurface, material );
	scene.add( domainSphere );
	THREE.SceneUtils.attach(domainSphere, scene, left);
	
	domainSphere.position.set(0,0,0);

	var rangeSurface = new THREE.SphereGeometry(5, 32, 32);
	for (var i = 0; i < rangeSurface.vertices.length; i++) {
		rangeSurface.vertices[i] = callback(rangeSurface.vertices[i]);
	}
	//rangeSurface.applyMatrix(new THREE.Matrix4().makeTranslation(right.position.x, right.position.y, right.position.z));
	var rangeShape = new THREE.Mesh(rangeSurface, material);
	scene.add(rangeShape);
	THREE.SceneUtils.attach(rangeShape, scene, right);
	rangeShape.position.set(0,0,0);
	return [domainSphere, rangeShape]
}


// Janky and assumes linearity of input -> translation mapping, but whatever.
var updateMeshWithInput = function(mesh, vec) {
	mesh.geometry.dynamic = true;
	if (mesh.geometry.vertices.length == cursorSurface.vertices.length) {
		for (var i = 0; i < cursorSurface.vertices.length; i++) {
			mesh.geometry.vertices[i].copy(cursorSurface.vertices[i]).add(vec);
		}
	} else {
		console.log(["error"][3]);
	}
	//mesh.position.set(x,y,z); // not working because I want to change the vertices, not the position.
	mesh.geometry.verticesNeedUpdate = true;
}

var animating = true;

var stopAnimation = function(){
	animating = false;
	document.getElementById("animationToggle").innerHTML = "Continue animation";
}

var buttonHandler = function(){
	if (animating){
		stopAnimation();
	} else {
		animating = true;
		document.getElementById("animationToggle").innerHTML = "Stop animation";
		render();
	}
}

var hashRespond = function(){
	var hash = window.location.hash.substring(1); // hash part of url withou the first letter (#)
    $("section").hide();
    if (hash != "demo") {
    	stopAnimation();
    }
    //document.getElementById("debug").innerHTML = hash;
    
    if (hash == "") {
      $("#home").show();
    } else {
      $("#"+hash).show();
    }
}

$( document ).ready(function() {
	hashRespond();
	$(window).on("hashchange", hashRespond);
});

var updateRangeWithDomain = function(range,domain,callback) {
	range.geometry.dynamic = true;
	if (range.geometry.vertices.length == domain.geometry.vertices.length) {
		for (var i = 0; i < domain.geometry.vertices.length; i++) {
			range.geometry.vertices[i] = callback(domain.geometry.vertices[i]);
		}
	} else {
		console.log(["error"][3]);
	}
	range.geometry.verticesNeedUpdate = true;
}


var render = function () {
	var t = 0.002 * new Date().getTime();
	inputX = (mouse.x / $(window).width()) - 0.5;
	inputY = (mouse.y / $(window).height()) - 0.5
	updateMeshWithInput(surfaces[DOMAIN], new THREE.Vector3( -10*inputX , 10 * inputX, -10 * inputY) );
	updateRangeWithDomain(surfaces[RANGE], surfaces[DOMAIN], myFunction);
	var cameraTarget = new THREE.Vector3(20 - 30 *inputX, 20 + inputX * 20, 10 - inputY * 20)
	camera.position.lerp(cameraTarget, 0.01);
	//camera.position.x = 20 + 2 * Math.sin(t);
	//camera.position.y = 20 - 2 * Math.sin(t);
	camera.lookAt(new THREE.Vector3(0,0,0));
	
	if (animating) {
		requestAnimationFrame( render );
	}
	renderer.render(scene, camera);
};

var mouse = {x: 0, y: 0};

document.addEventListener('mousemove', function(e){ 
    mouse.x = e.clientX || e.pageX; 
    mouse.y = e.clientY || e.pageY 
}, false);


var scene = new THREE.Scene();
var width = 1168;//window.innerWidth - 20;
var height = 600;//window.innerHeight - 50;
//var camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 1000 );
var camera = new THREE.PerspectiveCamera( 40, width/height, 0.1, 1000 );
var renderer = new THREE.WebGLRenderer({alpha:true});
renderer.setSize( width, height );

var offset = 7;
var axesSize = 1;

var linematerial = new THREE.LineBasicMaterial({
	color: 0x000000,
	linewidth: 10
});

var leftPlot = constructPlot(offset, -offset, 0);
var rightPlot = constructPlot(-offset, offset, 0);


var functionPlot = 1;

var light = new THREE.PointLight( 0xff0000, 1, 100 );
light.position.set( 20, 20, 20 );
scene.add( light );

var light2 = new THREE.PointLight( 0x0000ff, 1, 100 );
light2.position.set( 20, -20, 20 );
scene.add( light2 );

var light3 = new THREE.PointLight( 0xffff00, 1, 100 );
light3.position.set( -20, 20, 20 );
scene.add( light3 );

fShow33(myFunction, leftPlot, rightPlot);

surfaces = bubbleSample(myFunction, leftPlot, rightPlot);

var DOMAIN = 0;
var RANGE = 1;

var cursorSurface = new THREE.SphereGeometry(10,32,32);
var min = new THREE.Vector3(-4,-4,-4);
var max = new THREE.Vector3(4,4,4);
for (var i = 0; i < cursorSurface.vertices.length; i++) {
	cursorSurface.vertices[i] = cursorSurface.vertices[i].clamp(min,max);
}

// point camera
camera.position.set = (10,20,20);
camera.up.set(0,0,1);
camera.lookAt(new THREE.Vector3(0,0,0));
//var windowResize = THREEx.WindowResize(renderer, camera)

var meshDictionary = new Object();
render();