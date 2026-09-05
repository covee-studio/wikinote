function MistClouds() {
  return <>
    <div className="mist-cloud mist-cloud-blue" />
    <div className="mist-cloud mist-cloud-green" />
    <div className="mist-cloud mist-cloud-pearl" />
    <div className="mist-reading-light" />
  </>
}

export function MistTheme() {
  return <div aria-hidden className="theme-scene mist-scene"><MistClouds /></div>
}

export function MistPreview() {
  return <div className="theme-scene theme-preview mist-scene"><MistClouds /></div>
}
