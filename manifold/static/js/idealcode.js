// what would I want the code to look like?

// Declare a bunch of spaces
var A = new Space3();
var B = new Space3();
var C = new Space3();
var A2 = new Space3();
var B2 = new Space3();
var C3 = new Space3();

// define functions
var f = new function(vec) {
	return new Vector3(vec.x, vec.y, vec.z+Math.sin(vec.x));
}

var g = new function(vec) {
	return new Vector3(vec.x+Math.sin(vec.z), vec.y, vec.z);
}

// set up Jacobians
var Df = new ApproximateJacobian(f, 0.01);
var Dg = new ApproximateJacobian(g, 0.01);

// draw a bunch of arrows connecting things
var f_arrow = arrow(A, B, "f:A->B");
var g_arrow = arrow(B, C, "g:B->C");
var Df_arrow = arrow(A2, B2, "Df:R_3->R_3");
var Dg_arrow = arrow(B2, C2, "Dg:R_3->R-3");
var D_arrow_1 = arrow(f_arrow, Df_arrow, none);
var D_arrow_2 = arrow(g_arrow, Dg_arrow, none);

// Draw surfaces in A, B and C
var surface_A = new Surface("cube", A);
var surface_B = new image(f, surface_A, B);
var surface_C = new image(g, surface_B, C);

// Show bases in A2, B2 and C2
var basis_A = new unitBasis(3, A2);
var basis_B = new image(basis_A, Df, B2);
var basis_C = new image(basis_B, Dg, C2);

