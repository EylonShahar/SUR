var o_vertexBufferS1; 
var o_vertexBufferS2; 
var o_vertexBufferCursor; 
var o_vertexBufferCircle; 
var u_ModelMatrix;
var u_ProjMatrix;
var modelMatrix;
var projMatrix;
var currentAngle;
var ANGLE_STEP = 45.0;
var direction = 1.0;
var esu_Stage;
var esu_EnableTex2D;
var a_Position;
var a_TexCoord1; 
var a_TexCoord2d;
var g_texture2D;
var g_textureTerrain;
var g_texture1D;
var u_Sampler2D;
var u_SamplerTerrain;
//var u_Sampler1D;
var g_cursorX=0.0;
var g_cursorY=0.0;

var NORMAL_MODE = 1;
var EXPAND_MODE = 2;
var g_curMode = NORMAL_MODE;
var g_modelviewStack;
var g_projectionStack;

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
  g_modelviewStack = new ESWGL_MatrixStack(gl, u_ModelMatrix);

  u_ProjMatrix = gl.getUniformLocation(gl.program, 'u_ProjMatrix');
  if (!u_ProjMatrix) { 
    console.log('Failed to get the storage location of u_ProjMatrix');
    return;
  }
  g_projectionStack = new ESWGL_MatrixStack(gl, u_ProjMatrix);
  
   
  esu_Stage = new ESWGL_Uniform(gl, 'u_Stage');
  esu_EnableTex2D = new ESWGL_Uniform(gl, 'u_EnableTex2D', false);
  
  //createTexture1D(gl);
  createTexture2D(gl, canvas);
  
  u_Sampler2D = gl.getUniformLocation(gl.program, 'u_Sampler2D');
  if (!u_Sampler2D) {
    console.log('Failed to get the storage location of u_Sampler2D');
    return false;
  }
  gl.uniform1i(u_Sampler2D, 0);

  u_SamplerTerrain = gl.getUniformLocation(gl.program, 'u_SamplerTerrain');
  if (!u_SamplerTerrain) {
    console.log('Failed to get the storage location of u_SamplerTerrain');
    return false;
  }
  gl.uniform1i(u_SamplerTerrain, 1);

  
  //u_Sampler1D
  
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
  initCursorVertices(gl);
  initCircleVertices(gl);
   	
  projMatrix.setOrtho(-1.0, 1.0, -1.0, 1.0, -1.0, 1.0);

   document.onkeydown = function(ev){ 
       keydown(ev, gl); 
	 };
   
    // Start drawing
   var tick = function() {
     currentAngle = animate(currentAngle);  // Update the rotation angle
     draw(gl);   // Draw the triangle
     requestAnimationFrame(tick, canvas); // Request that the browser calls tick
   };
   tick();
}

function drawStage1(gl) {
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, g_texture2D);
	
	gl.activeTexture(gl.TEXTURE1);
	gl.bindTexture(gl.TEXTURE_2D, g_textureTerrain);
	
	esu_Stage.setValue(1);
	//esu_EnableTex2D.setValue(1);
	o_vertexBufferS1.draw(gl);  
}

function drawStage3(gl) {
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, g_texture2D);
	
	gl.activeTexture(gl.TEXTURE1);
	gl.bindTexture(gl.TEXTURE_2D, g_textureTerrain);
	
	esu_Stage.setValue(3);
	//esu_EnableTex2D.setValue(1);
	o_vertexBufferS1.draw(gl);  
}

function drawStage2(gl) {
  esu_Stage.setValue(2);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, g_textureTerrain);
  o_vertexBufferS2.draw(gl);  
}

function drawCursor(gl) {
  esu_Stage.setValue(4);
  o_vertexBufferCursor.draw(gl);
}

function drawCircle(gl, rad) {
	esu_Stage.setValue(4);
	g_modelviewStack.push(modelMatrix);
	modelMatrix.setScale(rad, rad, rad);
	gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
	o_vertexBufferCircle.draw(gl);
	
	modelMatrix = g_modelviewStack.pop();
}

function draw(gl) {
  gl.clear(gl.COLOR_BUFFER_BIT);
  
  modelMatrix.setIdentity();

  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.uniformMatrix4fv(u_ProjMatrix, false, projMatrix.elements);
  drawStage1(gl);
  
  g_modelviewStack.push(modelMatrix);
  modelMatrix.rotate(currentAngle, 0, 0, 1); // Rotation angle, rotation axis (0, 0, 1)
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  drawStage2(gl);
  modelMatrix = g_modelviewStack.pop();
  
  copyTexImage(gl);
    
  if (g_curMode == EXPAND_MODE) {
	g_projectionStack.push(projMatrix);
	ESWGL_setOrtho(gl, projMatrix, u_ProjMatrix, g_cursorX-0.15, g_cursorX+0.15, g_cursorY-0.15, g_cursorY+0.15, -1, 1);
	
	drawStage3(gl);
	
	projMatrix = g_projectionStack.pop();
  }
  else {
	drawStage3(gl);
    modelMatrix.setTranslate(g_cursorX, g_cursorY, 0);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    drawCursor(gl);
	modelMatrix.setIdentity();
	drawCircle(gl, 0.25);
	drawCircle(gl, 0.5);
	drawCircle(gl, 0.75);
	drawCircle(gl, 1.0);

  }  
}


function copyTexImage(gl) {
	viewport = gl.getParameter(gl.VIEWPORT);
	// Bind the texture object to the target
	gl.activeTexture(gl.TEXTURE0);
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

function initCursorVertices(gl) {
   var vertices = new Float32Array([
     -0.15, 0.0,
     -0.05, 0.0,
     0.05, 0.0,
     0.15, 0.0,
     0.0, -0.15,
     0.0, -0.05,
     0.0, 0.15,
     0.0, 0.05,
    ]);
 
  var FSIZE = vertices.BYTES_PER_ELEMENT;
  console.log('FSIZE = ' + FSIZE);
  
  o_vertexBufferCursor = new ESWGL_VBO(gl, vertices);
  
  o_vertexBufferCursor.onDraw = function(gl) {
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, FSIZE*2, 0);
    gl.enableVertexAttribArray(a_Position);
        
    gl.drawArrays(gl.LINES, 0, 8);  	
    
    gl.disableVertexAttribArray(a_Position);
  }
}


function initCircleVertices(gl) {
	var CIRCLE_NOF_POINTS = 128;
  var vertices = new Float32Array(CIRCLE_NOF_POINTS*2);
   
  for (i = 0; i < CIRCLE_NOF_POINTS; ++i) {
    a = i * 2.0 * Math.PI / CIRCLE_NOF_POINTS;
	//console.log(a);
	vertices[2*i] = Math.sin(a);
	vertices[2*i+1] = Math.cos(a);
	//console.log('= ' + vertices[i] + ', ' + vertices[i+1]);
  }
   
  var FSIZE = vertices.BYTES_PER_ELEMENT;
  console.log('FSIZE = ' + FSIZE);
  
  o_vertexBufferCircle = new ESWGL_VBO(gl, vertices);
  
  o_vertexBufferCircle.onDraw = function(gl) {
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, FSIZE*2, 0);
    gl.enableVertexAttribArray(a_Position);
        
    gl.drawArrays(gl.LINE_LOOP, 0, CIRCLE_NOF_POINTS);  	
    
    gl.disableVertexAttribArray(a_Position);
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


function loadTerrainTexture(gl, texture, image) {
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); // Flip the image's y axis
	// Enable texture unit0
	gl.activeTexture(gl.TEXTURE1);
	// Bind the texture object to the target
	gl.bindTexture(gl.TEXTURE_2D, texture);
	
	// Set the texture parameters
	//gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); 
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	
	// Set the texture image
	console.log("150")
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
	console.log("160")
	
	// Set the texture unit 0 to the sampler
	//gl.uniform1i(u_Sampler, 0);
	
	//gl.clear(gl.COLOR_BUFFER_BIT);   // Clear <canvas>
	
	//gl.drawArrays(gl.TRIANGLE_STRIP, 0, n); // Draw the rectangle
}

function initTerrainTexture(gl) {
	var texture = gl.createTexture();   // Create a texture object
	if (!texture) {
		console.log('Failed to create the texture object');
		return false;
	}
	
	// Get the storage location of u_Sampler
	//var u_Sampler = gl.getUniformLocation(gl.program, 'u_Sampler');
	//if (!u_Sampler) {
	//	console.log('Failed to get the storage location of u_Sampler');
	//	return false;
	//}
	
	var image = new Image();  // Create the image object
	if (!image) {
		console.log('Failed to create the image object');
		return false;
	}
	
	console.log("100")
	// Register the event handler to be called on loading an image
	image.onload = function() { 
		loadTerrainTexture(gl, texture, image); 
	};
	
	// Tell the browser to load an image
	image.src =  'sur.jpg';// 'sky.jpg';
	//image.src =  'sky.jpg';
	
	return texture;
	
}

function createTexture2D(gl, canvas) {
	g_textureTerrain = initTerrainTexture(gl);
	//gl.bindTexture(gl.TEXTURE_2D, g_texture2D);
	//return true;


	g_texture2D = gl.createTexture();   // Create a texture object
	if (!g_texture2D) {
		console.log('Failed to create the texture object');
		return false;
	}

  gl.activeTexture(gl.TEXTURE0);
	// Bind the texture the target (TEXTURE_2D) of the active texture unit.
  gl.bindTexture(gl.TEXTURE_2D, g_texture2D);
        
  // Set the parameters so we can render any size image.        
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); 
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  
    // Upload the resized canvas image into the texture.
  //    Note: a canvas is used here but can be replaced by an image object. 
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, canvas);
}


function createTexture1D(gl) {
   g_texture1D = gl.createTexture();   // Create a texture object
  if (!g_texture1D) {
    console.log('Failed to create the texture object');
    return false;
  }

 
  var imagBuf = new Uint8ClampedArray(256 * 3);
  for (i = 0; i < 256; ++i) {
	imagBuf[3*i] = 100;
	imagBuf[3*i + 1] = 100;
	imagBuf[3*i + 2] = 100;
  }

  
  gl.activeTexture(gl.TEXTURE0);
// Bind the texture the target (TEXTURE_2D) of the active texture unit.
  gl.bindTexture(gl.TEXTURE_2D, g_texture1D);
  
  // Flip the image's Y axis to match the WebGL texture coordinate space.
  //gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      
  // Set the parameters so we can render any size image.        
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); 
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  
  
	var lcanvas = document.createElement('canvas');
	var imageData = lcanvas.getContext('2d').createImageData(16, 16);
	imageData.data.set(imagBuf);
	
    // Upload the resized canvas image into the texture.
  //    Note: a canvas is used here but can be replaced by an image object. 
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, lcanvas);
  
}


function Faster() {
  if (ANGLE_STEP < 100) {
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

function Normal() {
  g_curMode = NORMAL_MODE;
}

function Expand() {
  g_curMode = EXPAND_MODE;
}

function keydown(ev, gl) {
  step = 4.0 / 512.0;
  //console.log(ev.keyCode);
  //alert('x = ' + ev.keyCode);
  if(ev.keyCode == 39) { // The right arrow key was pressed
    g_cursorX += step;
  } 
  else if (ev.keyCode == 37) { // The left arrow key was pressed
    g_cursorX -= step;
  } 
  else if (ev.keyCode == 38) { // The left arrow key was pressed
    g_cursorY += step;
  } 
  else if (ev.keyCode == 40) { // The left arrow key was pressed
    g_cursorY -= step;
  } 

}

