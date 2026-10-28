'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import maplibregl, { Map as MLMap, Marker } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { roads, Road } from '../lib/roads';
import {
  Search, MapPin, Play, Mountain, Navigation, ExternalLink,
  X, SlidersHorizontal, ChevronRight, Video, Info, List, Map as MapIcon
} from 'lucide-react';

type Vid = {
  id: string;
  title: string;
  channel: string;
  thumbnail: string;
  published: string;
  description: string;
};

export default function Home() {
  const mapEl = useRef<HTMLDivElement>(null);
  const map = useRef<MLMap | null>(null);
  const markers = useRef<Marker[]>([]);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState('');
  const [selected, setSelected] = useState<Road>(roads[0]);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All roads');
  const [videos, setVideos] = useState<Vid[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [activeVideo, setActiveVideo] = useState<Vid | null>(null);
  const [showRoads, setShowRoads] = useState(true);
  const [mobileView, setMobileView] = useState<'roads' | 'map' | 'videos'>('map');

  const filtered = useMemo(() => roads.filter(r =>
    `${r.name} ${r.route} ${r.region} ${r.state}`.toLowerCase().includes(query.toLowerCase()) &&
    (filter === 'All roads' || r.tags.includes(filter))
  ), [query, filter]);

  // Create the map once. Changing mapReady triggers marker creation afterward.
  useEffect(() => {
    if (!mapEl.current || map.current) return;
    const m = new maplibregl.Map({
      container: mapEl.current,
      style: {
        version: 8,
        sources: {
          carto: {
            type: 'raster',
            tiles: [`${window.location.origin}/api/tiles/{z}/{x}/{y}.png?v=2`],
            tileSize: 256,
            attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
          }
        },
        layers: [{ id: 'carto-raster', type: 'raster', source: 'carto' }]
      },
      center: [-83.0, 35.85],
      zoom: 6.65,
      attributionControl: false
    });
    map.current = m;
    m.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');
    m.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-left');
    m.on('load', () => { m.resize(); setMapError(''); });
    m.on('error', event => {
      console.error('Apex Roads map error:', event.error);
      setMapError(event.error?.message || 'Map tiles could not load.');
    });
    setMapReady(true);

    // Account for layout changes and initial rendering.
    const observer = new ResizeObserver(() => m.resize());
    observer.observe(mapEl.current);
    return () => {
      observer.disconnect();
      markers.current.forEach(marker => marker.remove());
      markers.current = [];
      map.current = null;
      m.remove();
    };
  }, []);

  // Rebuild markers only when the visible set of roads changes.
  useEffect(() => {
    if (!mapReady || !map.current) return;
    const m = map.current;
    markers.current.forEach(marker => marker.remove());
    markers.current = filtered.map(road => {
      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'map-pin';
      el.dataset.roadId = road.id;
      el.setAttribute('aria-label', `Select ${road.name}`);
      const dot = document.createElement('span');
      dot.className = 'pin-dot';
      const label = document.createElement('span');
      label.className = 'pin-label';
      label.textContent = road.name;
      el.append(dot, label);
      el.addEventListener('click', event => {
        event.stopPropagation();
        setSelected(road);
      });
      return new maplibregl.Marker({ element: el, anchor: 'center' })
        .setLngLat([road.lon, road.lat])
        .addTo(m);
    });
    return () => {
      markers.current.forEach(marker => marker.remove());
      markers.current = [];
    };
  }, [mapReady, filtered]);

  useEffect(() => {
    markers.current.forEach(marker => {
      const el = marker.getElement();
      el.classList.toggle('selected', el.dataset.roadId === selected.id);
    });
  }, [selected, filtered, mapReady]);

  // Selecting a road centers the map and loads videos from the WORKING API endpoint.
  useEffect(() => {
    if (mapReady) {
      map.current?.flyTo({
        center: [selected.lon, selected.lat], zoom: 9.8,
        essential: true, duration: 1100
      });
    }
  }, [selected, mapReady]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setMessage('');
    setVideos([]);
    fetch('/api/youtube?road=' + encodeURIComponent(selected.id), { signal: controller.signal })
      .then(async response => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Video search failed');
        return data;
      })
      .then(data => {
        setVideos(Array.isArray(data.videos) ? data.videos : []);
        setMessage(data.message || data.error || '');
      })
      .catch(error => {
        if (error.name !== 'AbortError') setMessage(error.message || 'Could not load videos.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [selected]);

  return <main className={'app view-' + mobileView}>
    <header className="topbar">
      <div className="brand"><span className="brand-icon"><Mountain size={22}/></span><span>APEX<span className="brand-light">ROADS</span><small>FIND YOUR NEXT DRIVE</small></span></div>
      <div className="top-center"><span className="live-dot"/> MOUNTAIN ROAD EXPLORER <span className="top-divider">/</span> SOUTHEAST USA</div>
      <a className="top-link" href="https://www.youtube.com" target="_blank" rel="noreferrer">POWERED BY YOUTUBE <ExternalLink size={13}/></a>
    </header>
    <div className="workspace">
      <aside className={'sidebar ' + (!showRoads ? 'hidden-mobile' : '')}>
        <div className="sidebar-head">
          <div className="eyebrow">DISCOVER</div>
          <h1>Find the<br/><em>perfect road.</em></h1>
          <p>Legendary curves. Epic views. Real driving footage.</p>
          <div className="searchbox"><Search size={17}/><input placeholder="Search roads, routes, regions..." value={query} onChange={e => setQuery(e.target.value)}/>{query && <button onClick={() => setQuery('')}><X size={15}/></button>}</div>
          <div className="filter-title"><SlidersHorizontal size={14}/> EXPLORE BY STYLE</div>
          <div className="chips">{['All roads', 'Twisty', 'Scenic', 'Technical', 'Cruise'].map(x => <button key={x} className={filter === x ? 'active' : ''} onClick={() => setFilter(x)}>{x}</button>)}</div>
        </div>
        <div className="road-list-header"><span>FEATURED ROADS</span><span>{filtered.length} ROUTES</span></div>
        <div className="road-list">{filtered.map((r, i) => <button key={r.id} className={'road-row ' + (selected.id === r.id ? 'active' : '')} onClick={() => { setSelected(r); setMobileView('map'); }}>
          <div className="road-index">{String(i + 1).padStart(2, '0')}</div>
          <div className="road-details"><strong>{r.name}</strong><span><MapPin size={12}/>{r.region} · {r.state}</span><div className="row-tags"><b>{r.route}</b>{r.tags.slice(0, 2).map(t => <i key={t}>{t}</i>)}</div></div><ChevronRight size={17}/>
        </button>)}{filtered.length === 0 && <div className="empty">No matching roads found.</div>}</div>
        <div className="sidebar-footer"><Navigation size={14}/> EXPLORE THE ROAD. WATCH THE DRIVE.</div>
      </aside>
      <section className="map-area">
        <div ref={mapEl} className="map"/>
        {mapError && <div role="alert" style={{position:"absolute",top:75,left:15,right:15,zIndex:5,background:"#18221b",border:"1px solid #d4fc64",color:"#fff",padding:14,borderRadius:8,fontSize:12}}>Map error: {mapError}</div>}
        <div className="map-top"><div className="map-badge"><span className="live-dot"/> INTERACTIVE ROAD MAP</div><button className="map-list-toggle" onClick={() => setShowRoads(!showRoads)}>{showRoads ? 'Hide' : 'Show'} road list</button></div>
        <div className="map-bottom-note"><Info size={14}/> Pins mark approximate road areas, not exact video GPS locations.</div>
        <div className="mobile-road-card">
          <div className="mobile-road-info">
            <div className="eyebrow">SELECTED ROAD <span>●</span> {selected.state}</div>
            <strong>{selected.name}</strong>
            <div className="route-line"><span className="route-badge">{selected.route}</span><span><MapPin size={12}/>{selected.region}</span></div>
          </div>
          <button className="mobile-watch" onClick={() => setMobileView('videos')}><Play size={15} fill="currentColor"/> Watch</button>
        </div>
      </section>
      <aside className="detail">
        <div className="detail-scroll">
          <div className="detail-top"><div className="eyebrow">SELECTED ROAD <span>●</span> {selected.state}</div><h2>{selected.name}</h2><div className="route-line"><span className="route-badge">{selected.route}</span><span><MapPin size={13}/>{selected.region}</span></div><p>{selected.description}</p><div className="detail-tags">{selected.tags.map(t => <span key={t}>{t}</span>)}</div></div>
          <div className="video-head"><div><div className="eyebrow">ON THE ROAD</div><h3>Driving videos <span>{videos.length || ''}</span></h3></div><Video size={20}/></div>
          <div className="video-list">{loading ? <div className="loading">Searching YouTube for driving footage...</div> : videos.length ? videos.map(v => <button className="video-card" key={v.id} onClick={() => setActiveVideo(v)}><div className="thumb"><img src={v.thumbnail} alt=""/><span className="play-icon"><Play size={19} fill="white"/></span></div><div className="video-info"><strong>{v.title}</strong><span>{v.channel}</span><small>{new Date(v.published).toLocaleDateString()}</small></div></button>) : <div className="video-empty"><Video size={30}/><strong>{message ? 'Unable to load videos' : 'No videos found yet'}</strong><p>{message || 'Try another road or view matching results on YouTube.'}</p></div>}</div>
          <a className="youtube-search" href={'https://www.youtube.com/results?search_query=' + encodeURIComponent(selected.search)} target="_blank" rel="noreferrer">Search this road on YouTube <ExternalLink size={15}/></a>
        </div>
        <div className="detail-footer">VIDEO MATCHES ARE BASED ON TITLES &amp; DESCRIPTIONS, NOT VERIFIED GPS DATA.</div>
      </aside>
    </div>
    <nav className="mobile-nav" aria-label="Mobile views">
      {([
        ['roads', 'Roads', List],
        ['map', 'Map', MapIcon],
        ['videos', 'Videos', Video]
      ] as const).map(([view, label, Icon]) => <button key={view} className={mobileView === view ? 'active' : ''} aria-current={mobileView === view ? 'page' : undefined} onClick={() => setMobileView(view)}><Icon size={19}/><span>{label}</span></button>)}
    </nav>
    {activeVideo && <div className="modal-backdrop" onClick={() => setActiveVideo(null)}><div className="video-modal" onClick={e => e.stopPropagation()}><button className="modal-close" onClick={() => setActiveVideo(null)} aria-label="Close"><X/></button><div className="video-frame"><iframe src={'https://www.youtube-nocookie.com/embed/' + activeVideo.id + '?autoplay=1'} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen title={activeVideo.title}/></div><div className="modal-info"><h3>{activeVideo.title}</h3><p>{activeVideo.channel}</p><a href={'https://www.youtube.com/watch?v=' + activeVideo.id} target="_blank" rel="noreferrer">Open on YouTube <ExternalLink size={14}/></a></div></div></div>}
  </main>;
}
