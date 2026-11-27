/* Troca do quadro do hero no mesmo efeito do Veríssimo: a peça seguinte cobre a anterior com tinta.
   Primeiro uma onda em preto e cinza com a borda molhada e escura, depois a cor vem atrás.
   tinta(tela, aoTrocar) -> true se o WebGL subiu (senão o main.js usa a cortina). */
(function () {
  var T1 = 3.4, ATRASO = 1.35, FIM = ATRASO + T1, PERIODO = 7.2;
  var RUIDO = 'float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}' +
    'float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}' +
    'float fb(vec2 p){float a=.5,r=0.;for(int k=0;k<5;k++){r+=a*n(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return r;}';
  var VS = 'attribute vec2 p;varying vec2 u;void main(){u=p*.5+.5;u.y=1.-u.y;gl_Position=vec4(p,0.,1.);}';
  var FS = ['precision highp float;varying vec2 u;uniform sampler2D A,B;uniform float s,t1,at;uniform vec2 c0;', RUIDO,
    'const vec3 LUM=vec3(.299,.587,.114);',
    'vec3 cinza(vec3 c){float l=dot(c,LUM);l=smoothstep(-.02,1.03,l);return vec3(pow(l,1.1))*vec3(1.,.985,.96);}',
    'void main(){',
    ' vec3 a=texture2D(A,u).rgb; if(s<0.){gl_FragColor=vec4(a,1.);return;}',
    ' vec3 b=texture2D(B,u).rgb;',
    ' vec2 q=(u-c0)*vec2(.8,1.); float di=length(q)*2.;',
    ' float r1=pow(clamp(s/t1,0.,1.),.85)*2.15, r2=pow(clamp((s-at)/t1,0.,1.),.85)*2.15;',
    ' float e1=di+(fb(q*3.6+vec2(2.,7.))-.5)*.42+(fb(q*16.)-.5)*.07;',
    ' float e2=di+(fb(q*3.1+vec2(9.,1.))-.5)*.46+(fb(q*14.+3.)-.5)*.08;',
    ' float m1=(1.-smoothstep(r1-.045,r1,e1))*step(.001,r1);',
    ' float m2=(1.-smoothstep(r2-.07,r2,e2))*step(.001,r2);',
    ' vec3 o=mix(a,cinza(b),m1); o=mix(o,b,m2);',
    ' float viva=step(.001,r1)*(1.-smoothstep(1.85,2.15,r1));',
    ' float rim=exp(-pow((e1-r1+.03)/.028,2.))*viva, bri=exp(-pow((e1-r1+.012)/.006,2.))*viva;',
    ' o*=1.-.5*rim; o+=bri*.1;',
    ' float vc=step(.001,r2)*(1.-smoothstep(1.85,2.15,r2)); float rc=exp(-pow((e2-r2+.04)/.05,2.))*vc;',
    ' o+=(o-vec3(dot(o,LUM)))*.25*rc;',
    ' gl_FragColor=vec4(o,1.);}'].join('\n');

  window.tinta = function (tela, aoTrocar) {
    var imgs = [].slice.call(tela.querySelectorAll('img'));
    var cv = document.createElement('canvas');
    var gl = cv.getContext('webgl', { alpha: false, antialias: false, premultipliedAlpha: false });
    if (!gl) return false;
    function sh(tp, src) { var o = gl.createShader(tp); gl.shaderSource(o, src); gl.compileShader(o); return gl.getShaderParameter(o, gl.COMPILE_STATUS) ? o : null; }
    var v = sh(gl.VERTEX_SHADER, VS), f = sh(gl.FRAGMENT_SHADER, FS);
    if (!v || !f) return false;
    var pr = gl.createProgram(); gl.attachShader(pr, v); gl.attachShader(pr, f); gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return false;
    gl.useProgram(pr);
    var bf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, bf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    var lp = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(lp); gl.vertexAttribPointer(lp, 2, gl.FLOAT, false, 0, 0);
    var U = {}; ['A', 'B', 's', 't1', 'at', 'c0'].forEach(function (k) { U[k] = gl.getUniformLocation(pr, k); });
    gl.uniform1i(U.A, 0); gl.uniform1i(U.B, 1); gl.uniform1f(U.t1, T1); gl.uniform1f(U.at, ATRASO);

    var TX = imgs.map(function () { return null; });
    function textura(i) {
      if (TX[i]) return TX[i];
      var t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, imgs[i]);
      [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T].forEach(function (w) { gl.texParameteri(gl.TEXTURE_2D, w, gl.CLAMP_TO_EDGE); });
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      return (TX[i] = t);
    }
    var cur = 0, nx = 1, ini = -1, roda = false;
    function tam() {
      var r = tela.getBoundingClientRect(), k = Math.min(window.devicePixelRatio || 1, 2);
      var W = Math.max(2, Math.round(r.width * k)), H = Math.max(2, Math.round(r.height * k));
      if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
      gl.viewport(0, 0, W, H);
    }
    function desenha(s) {
      tam();
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, textura(cur));
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, textura(nx));
      gl.uniform1f(U.s, s); gl.uniform2f(U.c0, .5, .44);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
    function quadro(t) {
      var s = (t - ini) / 1000;
      if (s >= FIM) { cur = nx; nx = (cur + 1) % imgs.length; desenha(-1); roda = false; return; }
      desenha(s); requestAnimationFrame(quadro);
    }
    function troca() {
      if (roda || document.hidden) return;
      roda = true; aoTrocar(imgs[nx]);
      requestAnimationFrame(function (t) { ini = t; quadro(t); });
    }
    Promise.all(imgs.map(function (im) { return im.decode ? im.decode().catch(function () {}) : null; })).then(function () {
      if (!imgs.every(function (im) { return im.complete && im.naturalWidth; })) return;
      tela.appendChild(cv); desenha(-1);
      setInterval(troca, PERIODO * 1000);
      addEventListener('resize', function () { if (!roda) desenha(-1); });
    });
    return true;
  };
})();
