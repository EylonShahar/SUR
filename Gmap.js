var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' + // 1
  'attribute float a_TexCoord1;\n' +
  'attribute vec2 a_TexCoord2d;\n' +
  
  'varying float v_TexCoord1;\n' +
  'varying vec2 v_TexCoord2d;\n' +
  
  'uniform mat4 u_ModelMatrix;\n' +
  'uniform mat4 u_ProjMatrix;\n' +
  'void main() {\n' +
  '  gl_Position = u_ProjMatrix* u_ModelMatrix * a_Position;\n' +
  '  v_TexCoord1 = a_TexCoord1;\n' +
  '  v_TexCoord2d = a_TexCoord2d;\n' +
  '}\n';

// Fragment shader program
var FSHADER_SOURCE =
  '#ifdef GL_ES\n' + // 1
  'precision mediump float;\n' +
  '#endif\n' +

  'uniform int u_EnableTex2D;\n' +  
  'uniform int u_Stage;\n' +
  'varying float v_TexCoord1;\n' +
  'varying vec2 v_TexCoord2d;\n' +
  'uniform sampler2D u_Sampler2D;\n' +
  'float rand(float co)\n' +
  '{\n' +
  '  return fract(sin(dot(vec2(co, co) ,vec2(12.9898,78.233))) * 43758.5453);\n' +
  '}\n' +
  'bool inRangeArcArea(float v)\n' +
  '{ \n' +
  '  if (abs(v_TexCoord1-v) < 0.0025) \n' +
  '    return true;\n' +
  '  else\n' +
  '    return false;\n' +
  '}\n' +
  'vec4 stage_1()\n' +
  '{\n' +
  '  vec4 fc;\n' +
  '  vec2 uv = v_TexCoord2d;\n' +
  '  if (u_EnableTex2D == 1)\n' +
  '    fc = texture2D(u_Sampler2D, uv);\n' +
  '  else\n' +
  '    fc = vec4(0.0, 1.0, 0.0, 1.0);\n' +
  '  if (fc[0] > 0.95)\n' +
  '    return fc;\n' +
  '  else' +
  '    return fc * 0.99;\n' +
  '}\n' +

  'vec4 stage_2()\n' +
  '{\n' +
  '  float c = 0.0;\n' +
  '  bool a0 = inRangeArcArea(0.25);\n' +
  '  bool a1 = inRangeArcArea(0.5);\n' +
  '  bool a2 = inRangeArcArea(0.75);\n' +
  '  if (a0 || a1 || a2)' +
  '    return vec4(1, 1, 1, 1.0);\n' +
  '  else\n' +
  '    c = rand(v_TexCoord1) * 0.5;\n' +
  '  return vec4(0, c, 0, 1.0);\n' +
  '}\n' +
  'void main() {\n' +
  '  if (u_Stage == 1)\n' +
  '    gl_FragColor = stage_1();\n' +
  '  else if (u_Stage == 2)\n' +
  '    gl_FragColor = stage_2();\n' +
  '  else\n' +
  '    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);\n' +
  '}\n';

function ESWGL_VBO(gl, vertices) {
  this.vertexBuffer_ = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer_);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
 
  this.onDraw = null;
  this.draw = function(gl) {
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer_);
	if (this.onDraw != null) {
	  this.onDraw(gl);
	}
	gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }
}
  
var o_vertexBufferS1; 
var o_vertexBufferS2; 
var u_ModelMatrix;
var u_ProjMatrix;
var modelMatrix;
var projMatrix;
var currentAngle;
var ANGLE_STEP = 45.0;
var direction = 1.0;
var u_Stage = 0;
var u_EnableTex2D;
var a_Position;
var a_TexCoord1; // = gl.getAttribLocation(gl.program, 'a_TexCoord1');
var a_TexCoord2d;
var fbo;
var has_texture_s1 = false;
var g_texture2D;
var u_Sampler2D;


function main() {
  // Retrieve <canvas> element
  var canvas = document.getElementById('webgl');
  
  // Get the rendering context for WebGL
  var gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // // Get the storage location of a_Position
  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }

  a_TexCoord1 = gl.getAttribLocation(gl.program, 'a_TexCoord1');
  a_TexCoord2d = gl.getAttribLocation(gl.program, 'a_TexCoord2d');
 
  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if (!u_ModelMatrix) { 
    console.log('Failed to get the storage location of u_ModelMatrix');
    return;
  }

  u_ProjMatrix = gl.getUniformLocation(gl.program, 'u_ProjMatrix');
  if (!u_ProjMatrix) { 
    console.log('Failed to get the storage location of u_ProjMatrix');
    return;
  }
  
   
  u_Stage = gl.getUniformLocation(gl.program, 'u_Stage');
  if (!u_Stage) { 
    console.log('Failed to get the storage location of u_Stage');
    return;
  }

  u_EnableTex2D = gl.getUniformLocation(gl.program, 'u_EnableTex2D');
  if (!u_EnableTex2D) { 
    console.log('Failed to get the storage location of u_EnableTex2D');
    return;
  }
  
  createTexture2D(gl, canvas);
  
  u_Sampler2D = gl.getUniformLocation(gl.program, 'u_Sampler2D');
  if (!u_Sampler2D) {
    console.log('Failed to get the storage location of u_Sampler2D');
    return false;
  }
  gl.uniform1i(u_Sampler2D, 0);
  
  // Current rotation angle
  currentAngle = 0.0;
  // Model matrix
  modelMatrix = new Matrix4();
  projMatrix = new Matrix4();
  
    // Register function (event handler) to be called on a mouse press
    //canvas.onmousedown = function(ev){ 
	//	currentAngle = click(ev); 
	//	 draw(gl);
	// };

  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  initVerticesStage1(gl);
  initVerticesStage2(gl);
      
  projMatrix.setOrtho(-1.0, 1.0, -1.0, 1.0, -1.0, 1.0);

    // Start drawing
   var tick = function() {
     currentAngle = animate(currentAngle);  // Update the rotation angle
     draw(gl);   // Draw the triangle
     requestAnimationFrame(tick, canvas); // Request that the browser calls tick
   };
   tick();
}

function drawStage1(gl) {
  var FSIZE = 4;

  gl.bindTexture(gl.TEXTURE_2D, g_texture2D);

  gl.uniform1i(u_Stage, 1);
  gl.uniform1i(u_EnableTex2D, 1);
  o_vertexBufferS1.draw(gl);  
}

function drawStage2(gl) {
  var FSIZE = 4;

  gl.uniform1i(u_Stage, 2);
  o_vertexBufferS2.draw(gl);  
}

function draw(gl) {
  gl.clear(gl.COLOR_BUFFER_BIT);
  
  modelMatrix.setIdentity();

  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.uniformMatrix4fv(u_ProjMatrix, false, projMatrix.elements);
  drawStage1(gl);
  
  modelMatrix.rotate(currentAngle, 0, 0, 1); // Rotation angle, rotation axis (0, 0, 1)
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  drawStage2(gl);  
  
  copyTexImage(gl);
}


function copyTexImage(gl) {
  viewport = gl.getParameter(gl.VIEWPORT);
  //console.log(viewp[0]);
  //console.log(viewp[1]);
  //console.log(viewp[2]);
  //console.log(viewp[3]);
  // gl.bind(...);
  gl.activeTexture(gl.TEXTURE0);
  // Bind the texture object to the target
  gl.bindTexture(gl.TEXTURE_2D, g_texture2D);
  gl.copyTexImage2D(gl.TEXTURE_2D, 0, gl.RGB, viewport[0], viewport[1], viewport[2], viewport[3], 0);
}

function initVerticesStage1(gl) {
   var vertices = new Float32Array([
     -1.0, -1.0, 0.0, 0.0,
     -1.0, 1.0, 0.0, 1.0,
     1.0, 1.0, 1.0, 1.0,
     1.0, -1.0, 1.0, 0.0,
    ]);
 
  var FSIZE = vertices.BYTES_PER_ELEMENT;
  console.log('FSIZE = ' + FSIZE);
  
  o_vertexBufferS1 = new ESWGL_VBO(gl, vertices);
  o_vertexBufferS1.onDraw = function(gl) {
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, FSIZE*4, 0);
    gl.enableVertexAttribArray(a_Position);
  
    gl.vertexAttribPointer(a_TexCoord2d, 2, gl.FLOAT, false, FSIZE*4, FSIZE*2);
    gl.enableVertexAttribArray(a_TexCoord2d);
    
    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);  	
    
    gl.disableVertexAttribArray(a_Position);
    gl.disableVertexAttribArray(a_TexCoord2d);
  }
}

function initVerticesStage2(gl) {

 console.log('create vertices')
  var vertices = new Float32Array(9);

  vertices[0] = 0.0;
  vertices[1] = 0.0;
  vertices[2] = 0.0;
  
  vertices[3] = 0.0;
  vertices[4] = 1.0;
  vertices[5] = 1.0;

  vertices[6] = 0.03272;
  vertices[7] = 0.99946;
  vertices[8] = 1.0;
  
  var FSIZE = vertices.BYTES_PER_ELEMENT;
  
  o_vertexBufferS2 = new ESWGL_VBO(gl, vertices);
  o_vertexBufferS2.onDraw = function(gl) {
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, FSIZE*3, 0);
    gl.enableVertexAttribArray(a_Position);
    
    gl.vertexAttribPointer(a_TexCoord1, 1, gl.FLOAT, false, FSIZE*3, FSIZE*2);
    gl.enableVertexAttribArray(a_TexCoord1);
    
    gl.drawArrays(gl.TRIANGLES, 0, 3);  	
    
    gl.disableVertexAttribArray(a_Position);
    gl.disableVertexAttribArray(a_TexCoord1);
  }  
}

var g_last = Date.now();
function animate(angle) {
  // Calculate the elapsed time
  var now = Date.now();
  var elapsed = now - g_last;
  g_last = now;
  // Update the current rotation angle (adjusted by the elapsed time)
  var step = (ANGLE_STEP * elapsed) / 1000.0;
  
  var newAngle = angle + step * direction;
  
  // if (newAngle >= 60.0) {
	// direction = -1.0
  // }
  // if (newAngle <= -60.0) {
	// direction = 1.0;
  // }
	
  return newAngle %= 360;
}

function click(ev) {
	var newAngle = currentAngle + 5.0;
	console.log(newAngle)
	return newAngle;
}

function createTexture2D(gl, canvas) {
   g_texture2D = gl.createTexture();   // Create a texture object
  if (!g_texture2D) {
    console.log('Failed to create the texture object');
    return false;
  }

  //var image = new Image(512, 512);  
  
  //var imagBuf = new Int8Array(512*512*3);
  //var abv = new ArrayBufferView();
  
  
  //var buffer = new ArrayBuffer(12);
  //var x = new DataView(buffer);
  //var bff = new ArrayBuffer;
  //var x = new DataView(bff);
  
  //gl.bindTexture(gl.TEXTURE_2D, g_texture2D);

  
  gl.activeTexture(gl.TEXTURE0);
// Bind the texture the target (TEXTURE_2D) of the active texture unit.
  gl.bindTexture(gl.TEXTURE_2D, g_texture2D);
  
  // Flip the image's Y axis to match the WebGL texture coordinate space.
  //gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      
  // Set the parameters so we can render any size image.        
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); 
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  
    // Upload the resized canvas image into the texture.
  //    Note: a canvas is used here but can be replaced by an image object. 
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, canvas);
}

function Faster() {
  if (ANGLE_STEP < 120) {
    ANGLE_STEP += 10; 
    console.log(ANGLE_STEP);
  }
}

function Slower() {
  if (ANGLE_STEP > 20) {
    ANGLE_STEP -= 10; 
    console.log(ANGLE_STEP);
  }
}
