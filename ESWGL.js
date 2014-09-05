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

function pick_arg(arg, def) {
   return (typeof arg == 'undefined' ? def : arg);
}

function ESWGL_Uniform(gl, name, enabled) {
  this.enabled = pick_arg(enabled, true);
  this.gl = gl;
  
  if (this.enabled) {
    this.u_var = gl.getUniformLocation(gl.program, name);
    if (!this.u_var) { 
      console.log('Failed to get the storage location of ' + name);
    }
  }
  
  this.setValue = function(val) {
    if (this.enabled)
	  this.gl.uniform1i(this.u_var, val);
  }
}

function ESWGL_MatrixStack(gl, loc) {
  this.matrixArray = [];
  this.gl = gl;
  this.loc = loc;
  
  this.push = function(mat) {
	newMath = new Matrix4(mat);
    this.matrixArray.push(newMath);
  }
  
  this.pop = function() {
    mat = this.matrixArray.pop();
	this.gl.uniformMatrix4fv(loc, false, mat.elements);
	return mat;
  }
}

function ESWGL_setOrtho(gl, projMatrix, u_ProjMatrix, x0, x1, y0, y1, z0, z1) {
  projMatrix.setOrtho(x0, x1, y0, y1, z0, z1);
  gl.uniformMatrix4fv(u_ProjMatrix, false, projMatrix.elements);
}

