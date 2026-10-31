/* Continuous, texture-preserving skin for the approved runner artwork. */
(function(root){
  'use strict';
  // A small regular mesh avoids cut edges between rotating image pieces.
  // The GPU moves the mesh; the original logo remains the only texture.
  function create(canvas,image,outline,motion){
    const gl=canvas.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:true});
    if(!gl)throw new Error('Runner skin is unavailable.');
    const compile=(type,source)=>{
      const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);
      if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(shader));
      return shader;
    };
    const vertex=compile(gl.VERTEX_SHADER,`
      attribute vec2 a_position;
      attribute vec4 a_bones;
      attribute vec4 a_weights;
      uniform mat3 u_bones[13];
      varying vec2 v_uv;
      void main(){
        vec3 p=vec3(a_position,1.0);
        vec3 skinned= u_bones[int(a_bones.x)]*p*a_weights.x
                    +u_bones[int(a_bones.y)]*p*a_weights.y
                    +u_bones[int(a_bones.z)]*p*a_weights.z
                    +u_bones[int(a_bones.w)]*p*a_weights.w;
        gl_Position=vec4(skinned.x/1568.0*2.0-1.0,1.0-skinned.y/1003.0*2.0,0.0,1.0);
        v_uv=a_position/vec2(1568.0,1003.0);
      }`);
    const fragment=compile(gl.FRAGMENT_SHADER,`
      precision mediump float;
      uniform sampler2D u_texture;
      varying vec2 v_uv;
      void main(){ gl_FragColor=texture2D(u_texture,v_uv); }`);
    const program=gl.createProgram();gl.attachShader(program,vertex);gl.attachShader(program,fragment);gl.linkProgram(program);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program));
    gl.deleteShader(vertex);gl.deleteShader(fragment);
    gl.useProgram(program);
    const ref=motion.REFERENCE_POSE;
    const bones=[
      [{x:1150,y:260},{x:1065,y:405}],
      [ref.rearLeg.hip,ref.rearLeg.knee],[ref.rearLeg.knee,ref.rearLeg.ankle],
      [ref.rearLeg.ankle,{x:875,y:630}],
      [ref.rearArm.shoulder,ref.rearArm.elbow],[ref.rearArm.elbow,ref.rearArm.wrist],
      [ref.rearArm.wrist,{x:980,y:323}],
      [ref.frontLeg.hip,ref.frontLeg.knee],[ref.frontLeg.knee,ref.frontLeg.ankle],
      [ref.frontLeg.ankle,{x:1120,y:563}],
      [ref.frontArm.shoulder,ref.frontArm.elbow],[ref.frontArm.elbow,ref.frontArm.wrist],
      [ref.frontArm.wrist,{x:1265,y:290}]
    ];
    function distance(p,a,b){
      const dx=b.x-a.x,dy=b.y-a.y;
      const t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy)));
      return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy);
    }
    function weights(x,y){
      // Keep face and upper neck rigid. Limb joints share nearby weights,
      // giving elbows and knees a continuous contour rather than a hinge cut.
      if(y<248&&x>1130)return [0,0,0,0,1,0,0,0];
      const p={x,y};
      const nearest=bones.map(([a,b],i)=>({i,d:distance(p,a,b)})).sort((a,b)=>a.d-b.d).slice(0,4);
      const values=nearest.map(({d})=>Math.exp(-(((d-nearest[0].d)/19)**2)));
      const sum=values.reduce((a,b)=>a+b,0);
      return [...nearest.map(n=>n.i),...values.map(v=>v/sum)];
    }
    const vertices=[];
    const add=(x,y)=>vertices.push(x,y,...weights(x,y));
    // Ten source pixels per cell retains the silhouette through fast motion.
    for(let y=180;y<660;y+=10)for(let x=840;x<1300;x+=10){
      add(x,y);add(x+10,y);add(x,y+10);
      add(x+10,y);add(x+10,y+10);add(x,y+10);
    }
    const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.STATIC_DRAW);
    for(const [name,size,offset]of [['a_position',2,0],['a_bones',4,8],['a_weights',4,24]]){
      const location=gl.getAttribLocation(program,name);gl.enableVertexAttribArray(location);gl.vertexAttribPointer(location,size,gl.FLOAT,false,40,offset);
    }
    const textureCanvas=document.createElement('canvas');textureCanvas.width=1568;textureCanvas.height=1003;
    const ctx=textureCanvas.getContext('2d');ctx.clip(new Path2D(outline));ctx.drawImage(image,0,0,1568,1003);
    const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,true);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,textureCanvas);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
    gl.viewport(0,0,canvas.width,canvas.height);
    const uniform=gl.getUniformLocation(program,'u_bones[0]');
    const matrices=new Float32Array(13*9);
    const put=(index,m)=>matrices.set([m[0],m[1],0,m[2],m[3],0,m[4],m[5],1],index*9);
    const limb=(index,ref,value,from,to)=>put(index,motion.boneMatrix(ref[from],ref[to],value[from],value[to]));
    const angle=(a,b)=>Math.atan2(b.y-a.y,b.x-a.x);
    function draw(pose){
      put(0,[1,0,0,1,0,pose.bounce]);
      for(const [side,index]of [['rear',1],['front',7]]){
        const leg=pose[side+'Leg'],arm=pose[side+'Arm'];
        const refLeg=ref[side+'Leg'],refArm=ref[side+'Arm'];
        limb(index,refLeg,leg,'hip','knee');limb(index+1,refLeg,leg,'knee','ankle');
        put(index+2,motion.rigidMatrix(refLeg.ankle,leg.ankle,(leg.footAngle-refLeg.footAngle)*Math.PI/180));
        limb(index+3,refArm,arm,'shoulder','elbow');limb(index+4,refArm,arm,'elbow','wrist');
        put(index+5,motion.rigidMatrix(refArm.wrist,arm.wrist,angle(arm.elbow,arm.wrist)-angle(refArm.elbow,refArm.wrist)));
      }
      gl.uniformMatrix3fv(uniform,false,matrices);gl.clear(gl.COLOR_BUFFER_BIT);gl.drawArrays(gl.TRIANGLES,0,vertices.length/10);
    }
    const lost=()=>root.dispatchEvent(new Event('resize'));
    canvas.addEventListener('webglcontextlost',lost,{once:true});
    function dispose(){
      canvas.removeEventListener('webglcontextlost',lost);
      gl.deleteTexture(texture);gl.deleteBuffer(buffer);gl.deleteProgram(program);
    }
    return {draw,dispose};
  }
  root.PapumPareRunnerSkin={create};
})(window);
