import { Circle, MapContainer, Marker, Polyline, Popup } from 'react-leaflet'
import { TileLayer } from 'react-leaflet'
import { useMapEvents } from 'react-leaflet/hooks'

import './leaflet.css';
import './App.css';

import { Route, RoutePoint, Station } from './model/route';
import { JSX, useState } from 'react';
import { fromLatLng, toLatLng } from './model/convert';
import { getCircleCenterPosition, getCircleBeginPosition, getCircleEndPosition, isClockwise, getShortestArc, normalizeAngle, GetTotalDistance, GetCurveBeginDistance, GetCurveEndDistance, GetLatLngFromDistance } from './model/distance';
import { Icon } from 'leaflet';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';

function App() {
  const [routes, setRoute] = useState([new Route("新規路線", [], [])] as Route[]);
  const [selectedRoute, setSelectedRoute] = useState(routes[0]);

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
    selectedRoute.points[index].chord = fromLatLng([e.target._latlng.lat, e.target._latlng.lng]);
    setSelectedRoute({ ...selectedRoute });
  }
  const handleAddPoint = (lat: number, lng: number) => {
    const [x, y] = fromLatLng([lat, lng]);
    const newPoint: RoutePoint = {
      id: crypto.randomUUID(),
      chord: [x, y],
      isEdge: false,
      curveRadius: 300,
    };
    const route = selectedRoute;
    route.points.push(newPoint);
    setRoute([...routes]);
    setSelectedRoute({ ...route });
  };
  const handleDeletePoint = (id: string) => {
    const route = selectedRoute;
    route.points = route.points.filter((point) => point.id !== id);
    // setSelectedRoute(route);
  }

  const pointIcon = new Icon({
    iconUrl: "/images/point.png",
    iconSize: [20, 20]
  });
  /* const markerIcon = new Icon({
    iconUrl: "/images/marker-icon-2x.png",
    iconSize: [25, 41],
    iconAnchor: [12.5, 41],
  }); */

  return (
    <div style={{display: "flex"}}>
      {/* 地図画面 */}
      <div style={{ width: "70vw", height: "100vh" }}>
        <MapContainer center={[35, 135]} zoom={10} style={{ height: "100%" }}>
          <TileLayer
            attribution="<a href='https://maps.gsi.go.jp/development/ichiran.html' target='_blank'>地理院タイル</a>"
            url="https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png"
          />
          <MapClickHandler onAddPoint={handleAddPoint} />

          {/* 選択以外の路線描画 */}
          {routes.filter(v => v.id !== selectedRoute.id).map(route => [route.points.map((point, index) => {
            if (index == 0) return <></>;
            if (index == route.points.length - 1) return <></>;

            const before = route.points[index - 1];
            const after = route.points[index + 1];

            function getCircle(pos0: [number, number], pos1: [number, number], pos2: [number, number], radius: number): JSX.Element[] {
              let posCenter = getCircleCenterPosition(pos0, pos1, pos2, radius);
              
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

                const circleLine2 = <Polyline key={`${route.id}_line1`} positions={line} color='red'></Polyline>
                
                return [circleLine2];
              }
            }
            
            return getCircle(before.chord, point.chord, after.chord, point.curveRadius);
          }), route.points.length == 2
            ? <Polyline key={`${route.id}_line2`} positions={[toLatLng(route.points[0].chord), toLatLng(route.points[1].chord)]} color="red"></Polyline>
            : <></>,
            route.points.length > 2
            ? <Polyline key={`${route.id}_line3`} positions={[toLatLng(route.points[0].chord), toLatLng(getCircleBeginPosition(route.points[0].chord, route.points[1].chord, route.points[2].chord, route.points[1].curveRadius))]} color="red"></Polyline>
            : <></>,
            route.points.length > 2
            ? <Polyline key={`${route.id}_line4`} positions={[toLatLng(route.points[route.points.length-1].chord), toLatLng(getCircleEndPosition(route.points[route.points.length-3].chord, route.points[route.points.length-2].chord, route.points[route.points.length-1].chord, route.points[route.points.length-2].curveRadius))]} color="red"></Polyline>
            : <></>,
            route.points.map((point, i) => {
            if (i == 0 || i == 1) return;
            if (i == route.points.length-1) return;

            const before2 = route.points[i-2];
            const before = route.points[i-1];
            const after = route.points[i+1];

            return <Polyline key={`${point.id}_line5`} positions={[
              toLatLng(getCircleEndPosition(before2.chord, before.chord, point.chord, before.curveRadius)),
              toLatLng(getCircleBeginPosition(before.chord, point.chord, after.chord, point.curveRadius))
            ]} color="red"></Polyline>
          }),])}

          {/* 選択路線の描画 */}
          {selectedRoute.points.map((point, index) => {
            if (index == 0) return <></>;
            if (index == selectedRoute.points.length - 1) return <></>;

            const before = selectedRoute.points[index - 1];
            const after = selectedRoute.points[index + 1];

            // 円の描画
            function getCircle(pos0: [number, number], pos1: [number, number], pos2: [number, number], radius: number): JSX.Element[] {
              let posCenter = getCircleCenterPosition(pos0, pos1, pos2, radius);
              let posBegin = getCircleBeginPosition(pos0, pos1, pos2, radius);
              let posEnd = getCircleEndPosition(pos0, pos1, pos2, radius);

              const circle = (<Circle key={`${selectedRoute.id}_${posCenter}`} center={toLatLng(posCenter)} radius={radius} fillOpacity={0} weight={0.5} color="black"></Circle>);
              const circleLine = (<Polyline key={`${selectedRoute.id}_${posCenter}_1`} positions={[toLatLng(posBegin), toLatLng(posCenter), toLatLng(posEnd)]} weight={1} color="black"></Polyline>);

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

                const circleLine2 = <Polyline key={`${selectedRoute.id}_${posCenter}_3`} positions={line} color='red'></Polyline>
                
                return [circle, circleLine, circleLine2];
              }
            }
            
            return getCircle(before.chord, point.chord, after.chord, point.curveRadius);
          }).flat().filter(v => v != null)}

          {/* 黒の折れ線描画 */}
          <Polyline positions={selectedRoute.points.map(v => toLatLng(v.chord))} color='black' weight={1}></Polyline>

          {/* 赤線描画 */}
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

            return <Polyline key={`${selectedRoute.id}_point${i}`} positions={[
              toLatLng(getCircleEndPosition(before2.chord, before.chord, point.chord, before.curveRadius)),
              toLatLng(getCircleBeginPosition(before.chord, point.chord, after.chord, point.curveRadius))
            ]} color="red"></Polyline>
          })}

          {/* 折れ点マーカー描画 */}
          {selectedRoute.points.map((point, index) => {
            const [lat, lng] = toLatLng(point.chord);
            return (
              <Marker
                key={point.id}
                position={[lat, lng]}
                draggable={true}
                /* icon={markerIcon} */
                data-xy={point.chord}
                eventHandlers={{
                  dragend: (e) => handleDragPoint(index, e), // ドラッグ終了時に新しい位置を更新
                }}
              />
            );
          })}

          {/* 駅マーカー描画 */}
          {selectedRoute.stations.map((station, _index) => {
            const xy = GetLatLngFromDistance(selectedRoute.points, station.distance);
            if (Number.isNaN(xy[0])) xy[0] = 0;
            if (Number.isNaN(xy[1])) xy[1] = 0;
            return <Marker key={`${selectedRoute.id}_${station.id}`} position={toLatLng(xy)} icon={pointIcon}>
              <Popup>{station.name}</Popup>
            </Marker>
          })}
        </MapContainer>
      </div>
      {/* プロパティ画面 */}
      <div style={{width: "30vw", height: "100vh", overflow: "scroll"}}>
        <div style={{height: "5%", display: 'flex', alignItems: 'center', justifyContent: "center"}}>
          <span style={{fontWeight: "bold"}}>線路図作成支援ツール</span>
        </div>
        <div style={{height: "25%"}}>
          <div style={{height: "20%", display: "flex"}}>
            <div style={{height: "100%", display: "flex", alignItems: "center"}}>
              <span style={{marginInline: "1ric", fontWeight: "bold"}}>路線管理</span>
            </div>
            <Button variant="outlined" onClick={() => {
              const currentIndex = routes.map((v, i) => v.id === selectedRoute.id ? i : null).find(v => v != null) || 0;
              routes[currentIndex] = selectedRoute;
              routes.push(new Route("新規路線", [], []));
              setRoute(routes);
              setSelectedRoute(routes[routes.length-1]);
            }}>路線追加</Button>
          </div>
          <div style={{height: "70%", overflow: "scroll", border: "1px black solid", padding: "2.5%"}}>
            {routes.map((v) => <div key={v.id} style={{display: "flex", backgroundColor: (v.id === selectedRoute.id) ? "#ddeeff" : ""}}>
              <TextField style={{width: "6ric", flex: "1"}} onChange={(e) => {v.name = e.target.value; setRoute([...routes]);}} value={v.name}></TextField>
              <Button variant="outlined" onClick={() => {
                setRoute(routes.filter((v1) => v.id !== v1.id));
                setSelectedRoute(routes[routes.length-1]);
              }}>削除</Button>
              <Button variant="contained" onClick={() => {
                const currentIndex = routes.map((v, i) => v.id === selectedRoute.id ? i : null).find(v => v != null) || 0;
                routes[currentIndex] = selectedRoute;
                setRoute([...routes]);
                setSelectedRoute(routes.find(v1 => v.id === v1.id) || routes[0]);
              }}>選択</Button>
            </div>)}
          </div>
        </div>
        <div style={{height: "25%"}}>
          <div style={{height: "20%", display: "flex"}}>
            <div style={{height: "100%", display: "flex", alignItems: "center"}}>
              <span style={{marginInline: "1ric", fontWeight: "bold"}}>経点管理</span>
            </div>
            <Button variant="outlined" onClick={() => {
              if (selectedRoute.points.length === 0) {
                return;
              }
              handleDeletePoint(selectedRoute.points[selectedRoute.points.length-1].id);
              setSelectedRoute({...selectedRoute});
            }}>1点削除</Button>
            <Button variant="outlined" onClick={() => {
              if (selectedRoute.points.length === 0) {
                return;
              }
              selectedRoute.points = [];
              setSelectedRoute({...selectedRoute});
            }}>全削除</Button>
          </div>
          <div style={{height: "70%", overflowY: "scroll", border: "1px black solid", padding: "2.5%"}}>{selectedRoute.points.map((point, index) => {
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
                  : <div>BC: {GetCurveBeginDistance(selectedRoute.points, index).toFixed(2)}</div>
                }</div>
                <div>{
                  isEdge 
                  ? <></>
                  : <div>EC: {GetCurveEndDistance(selectedRoute.points, index).toFixed(2)}</div>
                }</div>
              </div>
            </div>
          })}
          <div>全長{GetTotalDistance(selectedRoute.points).toFixed(2)}m</div>
          </div>
        </div>
        <div style={{height: "25%"}}>
          <div style={{height: "20%", display: "flex"}}>
            <div style={{height: "100%", display: "flex", alignItems: "center"}}>
              <span style={{marginInline: "1ric", fontWeight: "bold"}}>駅管理</span>
            </div>
            <Button variant="outlined" onClick={() => {
              selectedRoute.stations.push(new Station("", 0));
              setSelectedRoute({...selectedRoute});
            }}>駅追加</Button>
          </div>
          <div style={{height: "70%", overflowY: "scroll", border: "1px black solid", padding: "2.5%"}}>
            {selectedRoute.stations.map((station, index) => 
              <div key={station.id} style={{display: "flex"}}>
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
        </div>
        <div style={{height: "20%", display: "flex", flexFlow: "column"}}>
          <div>
            <Button variant="contained" onClick={() => {
              document.querySelector("textarea")!.value = JSON.stringify(routes);
            }}>JSON出力</Button>
            <Button variant="outlined" onClick={() => {
              if (!window.confirm("現在入力されているデータは全て削除されます。続行しますか？")) {
                return;
              }
              const text = document.querySelector("textarea")!.value || "";
              try {
                const obj = JSON.parse(text);
                setSelectedRoute(obj[0]);
                setRoute(obj);
              } catch {}
            }}>JSON入力</Button>
          </div>
          <textarea id='output-json' style={{flex: "1"}}></textarea>
        </div>
      </div>
    </div>
  )
}

export default App
