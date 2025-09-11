import React from 'react'

export function LayoutDebug() {
  const [screenInfo, setScreenInfo] = React.useState({ width: 0, height: 0 })

  React.useEffect(() => {
    const updateScreenInfo = () => {
      setScreenInfo({
        width: window.innerWidth,
        height: window.innerHeight
      })
    }

    updateScreenInfo()
    window.addEventListener('resize', updateScreenInfo)
    return () => window.removeEventListener('resize', updateScreenInfo)
  }, [])

  return (
    <div className="fixed top-20 right-4 bg-red-100 border border-red-300 p-3 rounded-lg text-xs z-[999]">
      <h4 className="font-bold text-red-800">Layout Debug</h4>
      <div className="text-red-700 mt-1">
        <div>Screen: {screenInfo.width}x{screenInfo.height}</div>
        <div>Sidebar: {screenInfo.width >= 1024 ? 'Fixed' : 'Overlay'}</div>
        <div>Content: {screenInfo.width >= 1024 ? 'ml-64' : 'ml-0'}</div>
      </div>
    </div>
  )
}
