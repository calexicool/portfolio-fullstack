import React, { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float, Environment } from '@react-three/drei'

function Shapes({ progressRef }){
  const group=useRef()
  const lerp=(a,b,t)=>a+(b-a)*t
  useFrame(({clock})=>{
    const t=clock.getElapsedTime()
    const p=progressRef.current||0
    if(group.current){
      group.current.rotation.y=t*0.12+p*Math.PI*2
      group.current.position.x=lerp(-0.8,0.8,p)
      group.current.rotation.x=Math.sin(t*0.2)*0.2
    }
  })
  return (
    <group ref={group}>
      <Float floatIntensity={1.5} rotationIntensity={0.4} speed={1.2}><mesh position={[-2.5,0.5,-6]}><torusKnotGeometry args={[0.9,0.28,128,32]}/><meshStandardMaterial metalness={0.6} roughness={0.2} color="#8b5cf6"/></mesh></Float>
      <Float floatIntensity={2} rotationIntensity={0.5} speed={1.1}><mesh position={[2.6,-0.2,-5]}><icosahedronGeometry args={[1.2,0]}/><meshStandardMaterial metalness={0.7} roughness={0.15} color="#22d3ee"/></mesh></Float>
      <Float floatIntensity={1.2} rotationIntensity={0.3} speed={1.4}><mesh position={[0.2,1.2,-7]}><dodecahedronGeometry args={[0.9,0]}/><meshStandardMaterial metalness={0.55} roughness={0.25} color="#34d399"/></mesh></Float>
      <ambientLight intensity={0.6}/><directionalLight position={[3,5,2]} intensity={1.1}/><Environment preset="city"/>
    </group>
  )
}

export default function Background3D({ progressRef }){
  return (
    <div className="pointer-events-none fixed inset-0 -z-10">
      <div className="absolute inset-0 bg-[conic-gradient(at_30%_30%,#0ea5e9_0deg,#a855f7_120deg,#10b981_240deg,#0ea5e9_360deg)] opacity-40 blur-2xl dark:opacity-50"/>
      <Canvas camera={{position:[0,0,4]}}><Shapes progressRef={progressRef}/></Canvas>
    </div>
  )
}
