import { Circle, MapContainer, Marker, Polyline, Popup } from 'react-leaflet'
import { TileLayer } from 'react-leaflet'
import { useMapEvents } from 'react-leaflet/hooks'

import './leaflet.css';
import './App.css';

import { RoutePoint, Station, TestRouteData } from './model/route';
import { JSX, useState } from 'react';
import { fromLatLng, toLatLng } from './model/convert';
import { getCircleCenterPosition, getCircleBeginPosition, getCircleEndPosition, isClockwise, getShortestArc, normalizeAngle, GetTotalDistance, GetCurveBeginDistance, GetCurveEndDistance, GetLatLngFromDistance } from './model/distance';
import { Icon } from 'leaflet';

function App() {
  // const [route, setRoute] = useState([] as Route[]);
  const [selectedRoute, setSelectedRoute] = useState(TestRouteData);

  const MapClickHandler = ({ onAddPoint }: { onAddPoint: (lat: number, lng: number) => void }) => {
    useMapEvents({
      click: (e) => {
        const { lat, lng } = e.latlng; // クリック位置の緯度経度
        onAddPoint(lat, lng);
      },
      keydown: (e) => {
        if (e.originalEvent.key == "z") {
          handleDeletePoint(selectedRoute.points[selectedRoute.points.length-1].id);
          setSelectedRoute({...selectedRoute});
        }
      },
    });
    return null;
  };

  const handleDragPoint = (index: number, e: any) => {
    console.log(e);
    selectedRoute.points[index].chord = fromLatLng([e.target._latlng.lat, e.target._latlng.lng]);
    setSelectedRoute({ ...selectedRoute });
  }
  const handleAddPoint = (lat: number, lng: number) => {
    const [x, y] = fromLatLng([lat, lng]);
    const newPoint: RoutePoint = {
      id: String(Date.now()),
      chord: [x, y],
      isEdge: false,
      curveRadius: 300,
    };
    const route = selectedRoute;
    route.points.push(newPoint);
    setSelectedRoute({ ...route });
  };
  const handleDeletePoint = (id: string) => {
    const route = selectedRoute;
    route.points = route.points.filter((point) => point.id !== id);
    // setSelectedRoute(route);
  }

  const icon = new Icon({
    iconUrl: "/public/images/point.png",
    iconSize: [20, 20]
  });

  return (
    <div style={{display: "flex"}}>
      <div style={{ width: "70vw", height: "100vh" }}>
        <MapContainer center={[35, 135]} zoom={10} style={{ height: "100%" }}>
          <TileLayer
            attribution="<a href='https://maps.gsi.go.jp/development/ichiran.html' target='_blank'>地理院タイル</a>"
            url="https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png"
          />
          <MapClickHandler onAddPoint={handleAddPoint} />
          {selectedRoute.points.map((point, index) => {
            if (index == 0) return <></>;
            if (index == selectedRoute.points.length - 1) return <></>;

            const before = selectedRoute.points[index - 1];
            const after = selectedRoute.points[index + 1];

            function getCircle(pos0: [number, number], pos1: [number, number], pos2: [number, number], radius: number): JSX.Element[] {
              let posCenter = getCircleCenterPosition(pos0, pos1, pos2, radius);
              let posBegin = getCircleBeginPosition(pos0, pos1, pos2, radius);
              let posEnd = getCircleEndPosition(pos0, pos1, pos2, radius);

              const circle = (<Circle key={String(posCenter)} center={toLatLng(posCenter)} radius={radius} fillOpacity={0} weight={0.5} color="black"></Circle>);
              const circleLine = (<Polyline key={String(posCenter)+"_1"} positions={[toLatLng(posBegin), toLatLng(posCenter), toLatLng(posEnd)]} weight={1} color="black"></Polyline>);

              {
                let line = [];
                const clockwise = isClockwise(pos0, pos1, pos2);
                let angleOffset = clockwise ? Math.PI / 2 : -Math.PI / 2;

                let start = normalizeAngle(Math.atan2(pos0[0] - pos1[0], pos0[1] - pos1[1]) + angleOffset);
                let end = normalizeAngle(Math.atan2(pos2[0] - pos1[0], pos2[1] - pos1[1]) - angleOffset);
                const ACCURACY = 20;
                const arcAngle = getShortestArc(start, end);

                let add = arcAngle / ACCURACY;

                for (let i = 0; i <= ACCURACY; i++) {
                  let angle = start + (add * i);
                  let addx = Math.sin(angle) * radius;
                  let addy = Math.cos(angle) * radius;

                  line.push(
                    toLatLng([
                      posCenter[0] + addx,
                      posCenter[1] + addy,
                    ])
                  );
                }

                const circleLine2 = <Polyline key={String(line)} positions={line} color='red'></Polyline>
                
                return [circle, circleLine, circleLine2];
              }
            }
            
            return getCircle(before.chord, point.chord, after.chord, point.curveRadius);
          }).flat().filter(v => v != null)}
          <Polyline positions={selectedRoute.points.map(v => toLatLng(v.chord))} color='black' weight={1}></Polyline>
          {selectedRoute.points.length == 2
            ? <Polyline positions={[toLatLng(selectedRoute.points[0].chord), toLatLng(selectedRoute.points[1].chord)]} color="red"></Polyline>
            : <></>}
          {selectedRoute.points.length > 2
            ? <Polyline positions={[toLatLng(selectedRoute.points[0].chord), toLatLng(getCircleBeginPosition(selectedRoute.points[0].chord, selectedRoute.points[1].chord, selectedRoute.points[2].chord, selectedRoute.points[1].curveRadius))]} color="red"></Polyline>
            : <></>}
          {selectedRoute.points.length > 2
            ? <Polyline positions={[toLatLng(selectedRoute.points[selectedRoute.points.length-1].chord), toLatLng(getCircleEndPosition(selectedRoute.points[selectedRoute.points.length-3].chord, selectedRoute.points[selectedRoute.points.length-2].chord, selectedRoute.points[selectedRoute.points.length-1].chord, selectedRoute.points[selectedRoute.points.length-2].curveRadius))]} color="red"></Polyline>
            : <></>}
          {selectedRoute.points.map((point, i) => {
            if (i == 0 || i == 1) return;
            if (i == selectedRoute.points.length-1) return;

            const before2 = selectedRoute.points[i-2];
            const before = selectedRoute.points[i-1];
            const after = selectedRoute.points[i+1];

            return <Polyline positions={[
              toLatLng(getCircleEndPosition(before2.chord, before.chord, point.chord, before.curveRadius)),
              toLatLng(getCircleBeginPosition(before.chord, point.chord, after.chord, point.curveRadius))
            ]} color="red"></Polyline>
          })}
          {selectedRoute.points.map((point, index) => {
            const [lat, lng] = toLatLng(point.chord);
            return (
              <Marker
                key={point.id}
                position={[lat, lng]}
                draggable={true}
                /* radius={2}
                color="black" */
                /* fillOpacity={0} */
                /* weight={1} */
                data-xy={point.chord}
                eventHandlers={{
                  dragend: (e) => handleDragPoint(index, e), // ドラッグ終了時に新しい位置を更新
                }}
              />
            );
          })}
          {selectedRoute.stations.map((station, _index) => {
            const xy = GetLatLngFromDistance(selectedRoute.points, station.distance);
            if (Number.isNaN(xy[0])) xy[0] = 0;
            if (Number.isNaN(xy[1])) xy[1] = 0;
            return <Marker position={toLatLng(xy)} icon={icon}>
              <Popup>{station.name}</Popup>
            </Marker>
          })}
        </MapContainer>
      </div>
      <div style={{width: "30vw", height: "100vh", overflow: "scroll"}}>
          <div>
            <button onClick={() => {
              handleDeletePoint(selectedRoute.points[selectedRoute.points.length-1].id);
              setSelectedRoute({...selectedRoute});
            }}>1点削除</button>
          </div>
          <div>{selectedRoute.points.map((point, index) => {
            const isEdge = index == 0 || index == selectedRoute.points.length-1;
            return <div key={point.id} style={{display: 'flex'}} className='curve-data'>
              {
                isEdge 
                ? <div style={{width: "6ric"}}>-</div>
                : <div style={{width: "6ric"}}><span>半径</span><input type="number" style={{width: "3ric"}} value={point.curveRadius} onChange={(v) => {
                  point.curveRadius = Number.parseInt(v.target.value) || 0;
                  setSelectedRoute({...selectedRoute});
                }} /></div>
              }
              <div>
                <div>{
                  isEdge 
                  ? <></>
                  : <div>BCC: {GetCurveBeginDistance(selectedRoute.points, index).toFixed(2)}</div>
                }</div>
                <div>{
                  isEdge 
                  ? <></>
                  : <div>ETC: {GetCurveEndDistance(selectedRoute.points, index).toFixed(2)}</div>
                }</div>
              </div>
            </div>
          })}
          <div>全長{GetTotalDistance(selectedRoute.points).toFixed(2)}m</div>
          </div>
          <hr></hr>
          <div>
            <div>
              <button onClick={() => {
                selectedRoute.stations.push(new Station());
                setSelectedRoute({...selectedRoute});
              }}>駅追加</button>
            </div>
            {selectedRoute.stations.map((station, index) => 
              <div style={{display: "flex"}}>
                <div>
                  駅名
                  <input style={{width: "6ric"}} type="text" value={station.name} onChange={(e) => {station.name = e.target.value; setSelectedRoute({...selectedRoute});}} />
                </div>
                <div>
                  距離程
                  <input style={{width: "6ric"}} type="number" value={station.distance} onChange={(e) => {station.distance = Number.parseInt(e.target.value) || 0; setSelectedRoute({...selectedRoute});}} />
                </div>
                <button onClick={() => {selectedRoute.stations = selectedRoute.stations.filter((_, i) => i !== index); setSelectedRoute({...selectedRoute});}}>削除</button>
              </div>
            )}
          </div>
          <hr></hr>
          <div>
            <div>
              <button onClick={() => {
                document.querySelector("textarea")!.value = JSON.stringify(selectedRoute);
              }}>JSON出力</button>
              <button onClick={() => {
                const text = document.querySelector("textarea")!.value || "";
                try {
                  setSelectedRoute(JSON.parse(text));
                } catch {}
              }}>JSON入力</button>
            </div>
            <textarea id='output-json' style={{width: "90%"}}></textarea>
          </div>
      </div>
    </div>
  )
}

export default App
