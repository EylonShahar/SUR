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
  'uniform float u_scanArray[512];\n' +
  'varying float v_TexCoord1;\n' +
  'varying vec2 v_TexCoord2d;\n' +
  'uniform sampler2D u_Sampler2D;\n' +
  'float rand(float co)\n' +
  '{\n' +
  '  return fract(sin(dot(vec2(co, co) ,vec2(12.9898,78.233))) * 43758.5453);\n' +
  '}\n' +
  //'bool inRangeArcArea(float v)\n' +
  //'{ \n' +
  //'  return false;' +
  //'  if (abs(v_TexCoord1-v) < 0.0025) \n' +
  //'    return true;\n' +
  //'  else\n' +
  //'    return false;\n' +
  //'}\n' +
  'vec4 stage_1()\n' +
  '{\n' +
  '  vec4 fc;\n' +
  '  vec2 uv = v_TexCoord2d;\n' +
  '  fc = texture2D(u_Sampler2D, uv);\n' +
  '  if (fc[0] > 0.95)\n' +
  '    return fc;\n' +
  '  else' +
  '    return fc * 0.99;\n' +
  '}\n' +

  'vec4 stage_2()\n' +
  '{\n' +
  // '	int idx = int(v_TexCoord1 * 512.0);\n' +
  // ' if (idx >= 512)\n' +
  // '		idx = 511;\n' +
  // ' if (idx < 0)\n' +
  // '		idx = 0;\n' +
  // '	float c = u_scanArray[idx];\n' +
  // '\n' +
	//'  float c = 0.0;\n' +
	'  float c = rand(v_TexCoord1) * 0.5;\n' +
	'  return vec4(0, c, 0, 1.0);\n' +
  '}\n' +
  'void main() {\n' +
  '  if (u_Stage == 1)\n' +
  '    gl_FragColor = stage_1();\n' +
  '  else if (u_Stage == 2)\n' +
  '    gl_FragColor = stage_2();\n' +
  '  else\n' +
  '    gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);\n' +
  '}\n';


