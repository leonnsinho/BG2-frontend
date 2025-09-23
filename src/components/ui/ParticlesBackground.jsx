import React from 'react'

export const ParticlesBackground = () => {
  // Criar array de partículas com posições e delays aleatórios
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    left: Math.random() * 100, // Posição horizontal aleatória (0-100%)
    size: Math.random() * 4 + 2, // Tamanho entre 2px e 6px
    animationDelay: Math.random() * 10, // Delay entre 0 e 10s
    animationDuration: 15 + Math.random() * 10, // Duração entre 15s e 25s
  }))

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute animate-float-up opacity-30"
          style={{
            left: `${particle.left}%`,
            bottom: '-10px',
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            backgroundColor: '#373435',
            borderRadius: '50%',
            animationDelay: `${particle.animationDelay}s`,
            animationDuration: `${particle.animationDuration}s`,
          }}
        />
      ))}
      
      {/* Partículas menores adicionais */}
      {Array.from({ length: 15 }, (_, i) => (
        <div
          key={`small-${i}`}
          className="absolute animate-float-up-slow opacity-20"
          style={{
            left: `${Math.random() * 100}%`,
            bottom: '-5px',
            width: '1px',
            height: '1px',
            backgroundColor: '#373435',
            borderRadius: '50%',
            animationDelay: `${Math.random() * 15}s`,
            animationDuration: `${20 + Math.random() * 15}s`,
          }}
        />
      ))}
    </div>
  )
}

export default ParticlesBackground