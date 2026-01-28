import {
  LayerGroup,
  LayersControl,
  MapContainer,
  Marker,
  Polyline,
  Popup,
} from "react-leaflet";
import { TileLayer } from "react-leaflet";
import { useMapEvents } from "react-leaflet/hooks";
import { FeatureCollection, LineString, Feature } from "geojson";

import "./leaflet.css";
import "./App.css";

import { Route, RoutePoint, Station } from "./model/route";
import { useState } from "react";
import { fromLatLng, toLatLng } from "./model/convert";
import {
  getCircleCenterPosition,
  getCircleBeginPosition,
  getCircleEndPosition,
  isClockwise,
  getShortestArc,
  normalizeAngle,
  GetTotalDistance,
  GetCurveBeginDistance,
  GetCurveEndDistance,
  GetLatLngFromDistance,
} from "./model/distance";
import { Icon } from "leaflet";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import { RouteView } from "./app/RouteView";
import { SelectedRouteView } from "./app/SelectedRouteView";
import { RedRouteView } from "./app/RedRouteView";

function App() {
  const [routes, setRoute] = useState([
    new Route("新規路線", [], []),
  ] as Route[]);
  const [selectedRoute, setSelectedRoute] = useState(routes[0]);

  const MapClickHandler = ({
    onAddPoint,
  }: {
    onAddPoint: (lat: number, lng: number) => void;
  }) => {
    useMapEvents({
      click: (e) => {
        const { lat, lng } = e.latlng; // クリック位置の緯度経度
        onAddPoint(lat, lng);
      },
      keydown: (e) => {
        if (e.originalEvent.key == "z") {
          handleDeletePoint(
            selectedRoute.points[selectedRoute.points.length - 1].id,
          );
          setSelectedRoute({ ...selectedRoute });
        }
      },
    });
    return null;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleDragPoint = (index: number, e: any) => {
    selectedRoute.points[index].chord = fromLatLng([
      e.target._latlng.lat,
      e.target._latlng.lng,
    ]);
    setSelectedRoute({ ...selectedRoute });
  };
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
  };

  const stationIcon = new Icon({
    iconUrl: "/images/station.svg",
    iconSize: [20, 20],
  });
  const selectedStationIcon = new Icon({
    iconUrl: "/images/station-selected.svg",
    iconSize: [20, 20],
  });
  const distanceIcon = new Icon({
    iconUrl: "/images/distance.svg",
    iconSize: [20, 20],
  });

  const getDistanceStr = (distance: number) => {
    const rawKilo = distance / 1000;
    const kilo = Math.floor(rawKilo);
    const meter = Math.floor(distance % 1000);
    const mili = Math.floor((distance * 1000) % 1000);

    return `${kilo}K${meter.toString().padStart(3, "0")}M${mili.toString().padStart(3, "0")}`;
  };

  return (
    <div style={{ display: "flex" }}>
      {/* 地図画面 */}
      <div style={{ width: "70vw", height: "100vh" }}>
        <MapContainer center={[35, 135]} zoom={10} style={{ height: "100%" }}>
          <MapClickHandler onAddPoint={handleAddPoint} />
          <LayersControl>
            <LayersControl.BaseLayer name="Open Street Map" checked>
              <TileLayer
                attribution='© <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer name="Open Street Map 2" checked>
              <TileLayer
                attribution='© <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png"
              />
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer name="地理院地図">
              <TileLayer
                attribution="<a href='https://maps.gsi.go.jp/development/ichiran.html' target='_blank'>地理院タイル</a>"
                url="https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png"
              />
            </LayersControl.BaseLayer>

            <LayersControl.Overlay name="路線描画" checked>
              <LayerGroup>
                <RouteView routes={routes} selectedRoute={selectedRoute} />
                <SelectedRouteView
                  routes={routes}
                  selectedRoute={selectedRoute}
                />

                {/* 黒の折れ線描画 */}
                <Polyline
                  positions={selectedRoute.points.map((v) => toLatLng(v.chord))}
                  color="black"
                  weight={1}
                ></Polyline>

                {/* 赤線描画 */}
                <RedRouteView routes={routes} selectedRoute={selectedRoute} />

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
              </LayerGroup>
            </LayersControl.Overlay>

            <LayersControl.Overlay name="距離程">
              <LayerGroup>
                {/* 距離程描画 */}
                {[
                  ...Array(
                    Math.floor(GetTotalDistance(selectedRoute.points) / 1000),
                  ),
                ].map((_, i) => {
                  const xy = GetLatLngFromDistance(
                    selectedRoute.points,
                    (i + 1) * 1000,
                  );
                  if (Number.isNaN(xy[0])) xy[0] = 0;
                  if (Number.isNaN(xy[1])) xy[1] = 0;
                  return (
                    <Marker
                      key={`${selectedRoute.id}_${i}`}
                      position={toLatLng(xy)}
                      icon={distanceIcon}
                    ></Marker>
                  );
                })}
              </LayerGroup>
            </LayersControl.Overlay>
            <LayersControl.Overlay name="駅">
              <LayerGroup>
                {/* 駅マーカー描画 */}
                {selectedRoute.stations.map((station) => {
                  const xy = GetLatLngFromDistance(
                    selectedRoute.points,
                    station.distance,
                  );
                  if (Number.isNaN(xy[0])) xy[0] = 0;
                  if (Number.isNaN(xy[1])) xy[1] = 0;
                  return (
                    <Marker
                      key={`${selectedRoute.id}_${station.id}`}
                      position={toLatLng(xy)}
                      icon={selectedStationIcon}
                    >
                      <Popup>{station.name}</Popup>
                    </Marker>
                  );
                })}
                {/* 駅マーカー描画 */}
                {routes
                  .filter((v) => v.id !== selectedRoute.id)
                  .flatMap((v) =>
                    v.stations.map((station) => {
                      const xy = GetLatLngFromDistance(
                        v.points,
                        station.distance,
                      );
                      if (Number.isNaN(xy[0])) xy[0] = 0;
                      if (Number.isNaN(xy[1])) xy[1] = 0;
                      return (
                        <Marker
                          key={`${v.id}_${station.id}`}
                          position={toLatLng(xy)}
                          icon={stationIcon}
                        >
                          <Popup>{station.name}</Popup>
                        </Marker>
                      );
                    }),
                  )}
              </LayerGroup>
            </LayersControl.Overlay>
          </LayersControl>
        </MapContainer>
      </div>
      {/* プロパティ画面 */}
      <div style={{ width: "30vw", height: "100vh", overflow: "scroll" }}>
        <div
          style={{
            height: "5%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span style={{ fontWeight: "bold" }}>線路図作成支援ツール</span>
        </div>
        <div style={{ height: "25%" }}>
          <div style={{ height: "20%", display: "flex" }}>
            <div
              style={{ height: "100%", display: "flex", alignItems: "center" }}
            >
              <span style={{ marginInline: "1ric", fontWeight: "bold" }}>
                路線管理
              </span>
            </div>
            <Button
              variant="outlined"
              onClick={() => {
                const currentIndex =
                  routes
                    .map((v, i) => (v.id === selectedRoute.id ? i : null))
                    .find((v) => v != null) || 0;
                routes[currentIndex] = selectedRoute;
                routes.push(new Route("新規路線", [], []));
                setRoute(routes);
                setSelectedRoute(routes[routes.length - 1]);
              }}
            >
              路線追加
            </Button>
          </div>
          <div
            style={{
              height: "70%",
              overflow: "scroll",
              border: "1px black solid",
              padding: "2.5%",
            }}
          >
            {routes.map((v) => (
              <div
                key={v.id}
                style={{
                  display: "flex",
                  backgroundColor: v.id === selectedRoute.id ? "#ddeeff" : "",
                }}
              >
                <TextField
                  style={{ width: "6ric", flex: "1" }}
                  onChange={(e) => {
                    v.name = e.target.value;
                    setRoute([...routes]);
                  }}
                  value={v.name}
                ></TextField>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setRoute(routes.filter((v1) => v.id !== v1.id));
                    setSelectedRoute(routes[routes.length - 1]);
                  }}
                >
                  削除
                </Button>
                <Button
                  variant="contained"
                  onClick={() => {
                    const currentIndex =
                      routes
                        .map((v, i) => (v.id === selectedRoute.id ? i : null))
                        .find((v) => v != null) || 0;
                    routes[currentIndex] = selectedRoute;
                    setRoute([...routes]);
                    setSelectedRoute(
                      routes.find((v1) => v.id === v1.id) || routes[0],
                    );
                  }}
                >
                  選択
                </Button>
              </div>
            ))}
          </div>
        </div>
        <div style={{ height: "25%" }}>
          <div style={{ height: "20%", display: "flex" }}>
            <div
              style={{ height: "100%", display: "flex", alignItems: "center" }}
            >
              <span style={{ marginInline: "1ric", fontWeight: "bold" }}>
                経点管理
              </span>
            </div>
            <Button
              variant="outlined"
              onClick={() => {
                if (selectedRoute.points.length === 0) {
                  return;
                }
                handleDeletePoint(
                  selectedRoute.points[selectedRoute.points.length - 1].id,
                );
                setSelectedRoute({ ...selectedRoute });
              }}
            >
              1点削除
            </Button>
            <Button
              variant="outlined"
              onClick={() => {
                if (selectedRoute.points.length === 0) {
                  return;
                }
                selectedRoute.points = [];
                setSelectedRoute({ ...selectedRoute });
              }}
            >
              全削除
            </Button>
          </div>
          <div
            style={{
              height: "70%",
              overflowY: "scroll",
              border: "1px black solid",
              padding: "2.5%",
            }}
          >
            {selectedRoute.points.map((point, index) => {
              const isEdge =
                index == 0 || index == selectedRoute.points.length - 1;
              return (
                <div
                  key={point.id}
                  style={{ display: "flex" }}
                  className="curve-data"
                >
                  {isEdge ? (
                    <div style={{ width: "6ric" }}>-</div>
                  ) : (
                    <div style={{ width: "6ric" }}>
                      <span>半径</span>
                      <input
                        type="number"
                        style={{ width: "3ric" }}
                        value={point.curveRadius}
                        onChange={(v) => {
                          point.curveRadius =
                            Number.parseInt(v.target.value) || 0;
                          setSelectedRoute({ ...selectedRoute });
                        }}
                      />
                    </div>
                  )}
                  <div>
                    <div>
                      {isEdge ? (
                        <></>
                      ) : (
                        <div style={{ fontFamily: "monospace" }}>
                          BC{" "}
                          {getDistanceStr(
                            GetCurveBeginDistance(selectedRoute.points, index),
                          )}
                        </div>
                      )}
                    </div>
                    <div>
                      {isEdge ? (
                        <></>
                      ) : (
                        <div style={{ fontFamily: "monospace" }}>
                          EC{" "}
                          {getDistanceStr(
                            GetCurveEndDistance(selectedRoute.points, index),
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div style={{ fontFamily: "monospace" }}>
              全長 {getDistanceStr(GetTotalDistance(selectedRoute.points))}
            </div>
          </div>
        </div>
        <div style={{ height: "25%" }}>
          <div style={{ height: "20%", display: "flex" }}>
            <div
              style={{ height: "100%", display: "flex", alignItems: "center" }}
            >
              <span style={{ marginInline: "1ric", fontWeight: "bold" }}>
                駅管理
              </span>
            </div>
            <Button
              variant="outlined"
              onClick={() => {
                selectedRoute.stations.push(new Station("", 0));
                setSelectedRoute({ ...selectedRoute });
              }}
            >
              駅追加
            </Button>
            <Button
              variant="outlined"
              onClick={() => {
                selectedRoute.stations = selectedRoute.stations.sort(
                  (a, b) => a.distance - b.distance,
                );
                setSelectedRoute({ ...selectedRoute });
              }}
            >
              駅ソート
            </Button>
          </div>
          <div
            style={{
              height: "70%",
              overflowY: "scroll",
              border: "1px black solid",
              padding: "2.5%",
            }}
          >
            {selectedRoute.stations.map((station, index) => (
              <div key={station.id} style={{ display: "flex" }}>
                <div>
                  駅名
                  <input
                    style={{ width: "6ric" }}
                    type="text"
                    value={station.name}
                    onChange={(e) => {
                      station.name = e.target.value;
                      setSelectedRoute({ ...selectedRoute });
                    }}
                  />
                </div>
                <div>
                  距離程
                  <input
                    style={{ width: "6ric" }}
                    type="number"
                    value={station.distance}
                    onChange={(e) => {
                      station.distance = Number.parseInt(e.target.value) || 0;
                      setSelectedRoute({ ...selectedRoute });
                    }}
                  />
                </div>
                <button
                  onClick={() => {
                    selectedRoute.stations = selectedRoute.stations.filter(
                      (_, i) => i !== index,
                    );
                    setSelectedRoute({ ...selectedRoute });
                  }}
                >
                  削除
                </button>
              </div>
            ))}
          </div>
        </div>
        <div style={{ height: "20%", display: "flex", flexFlow: "column" }}>
          <div>
            <Button
              variant="contained"
              onClick={() => {
                document.querySelector("textarea")!.value =
                  JSON.stringify(routes);
              }}
            >
              JSON出力
            </Button>
            <Button
              variant="contained"
              onClick={() => {
                document.querySelector("textarea")!.value = JSON.stringify(
                  selectedRoute.points
                    .map((point, index) => {
                      const isEdge =
                        index == 0 || index == selectedRoute.points.length - 1;
                      if (isEdge) {
                        return null;
                      }
                      const bc = GetCurveBeginDistance(
                        selectedRoute.points,
                        index,
                      );
                      const ec = GetCurveEndDistance(
                        selectedRoute.points,
                        index,
                      );
                      const radius = point.curveRadius;

                      return {
                        start: Math.floor(bc),
                        end: Math.floor(ec),
                        direction: "left",
                        radius,
                        speed: 0,
                      };
                    })
                    .filter((v) => v !== null),
                );
              }}
            >
              曲線出力
            </Button>
            <Button
              variant="contained"
              onClick={() => {
                document.querySelector("textarea")!.value = JSON.stringify(
                  selectedRoute.points
                    .map((point, index) => {
                      const isEdge =
                        index == 0 || index == selectedRoute.points.length - 1;
                      if (isEdge) {
                        return null;
                      }
                      const bc = GetCurveBeginDistance(
                        selectedRoute.points,
                        index,
                      );
                      const ec = GetCurveEndDistance(
                        selectedRoute.points,
                        index,
                      );
                      const radius = point.curveRadius;

                      let limitSpeed = 0;
                      if (radius < 70) {
                        limitSpeed = 25;
                      } else if (radius < 90) {
                        limitSpeed = 30;
                      } else if (radius < 110) {
                        limitSpeed = 35;
                      } else if (radius < 130) {
                        limitSpeed = 40;
                      } else if (radius < 150) {
                        limitSpeed = 45;
                      } else if (radius < 170) {
                        limitSpeed = 50;
                      } else if (radius < 200) {
                        limitSpeed = 55;
                      } else if (radius < 220) {
                        limitSpeed = 60;
                      } else if (radius < 240) {
                        limitSpeed = 65;
                      } else if (radius < 260) {
                        limitSpeed = 70;
                      } else if (radius < 280) {
                        limitSpeed = 75;
                      } else if (radius < 300) {
                        limitSpeed = 80;
                      } else if (radius < 340) {
                        limitSpeed = 85;
                      } else if (radius < 380) {
                        limitSpeed = 90;
                      } else if (radius < 420) {
                        limitSpeed = 95;
                      } else if (radius < 480) {
                        limitSpeed = 100;
                      } else if (radius < 520) {
                        limitSpeed = 105;
                      } else if (radius < 560) {
                        limitSpeed = 110;
                      } else if (radius < 620) {
                        limitSpeed = 115;
                      }

                      if (limitSpeed === 0) {
                        return null;
                      }

                      return {
                        start: Math.floor(bc),
                        end: Math.floor(ec),
                        speed: limitSpeed,
                      };
                    })
                    .filter((v) => v !== null),
                );
              }}
            >
              速度制限出力
            </Button>
            <Button
              variant="contained"
              onClick={() => {
                document.querySelector("textarea")!.value = JSON.stringify(
                  selectedRoute.stations
                    .map((station) => {
                      if (station.distance === null) return null;
                      return {
                        position: station.distance,
                        stationName: station.name,
                        trackName: "",
                        isPass: false,
                      };
                    })
                    .filter((v) => v !== null),
                );
              }}
            >
              駅出力
            </Button>
            <Button
              variant="contained"
              onClick={() => {
                document.querySelector("textarea")!.value = JSON.stringify({
                  type: "FeatureCollection",
                  features: routes
                    .flatMap((route) => [
                      route.points.length == 2
                        ? ({
                            type: "Feature",
                            geometry: {
                              type: "LineString",
                              coordinates: [
                                toLatLng(route.points[0].chord).reverse(),
                                toLatLng(route.points[1].chord).reverse(),
                              ],
                            } satisfies LineString,
                            properties: null,
                          } satisfies Feature)
                        : ({
                            type: "Feature",
                            geometry: {
                              type: "LineString",
                              coordinates: [],
                            },
                            properties: null,
                          } satisfies Feature),
                      route.points.length > 2
                        ? ({
                            type: "Feature",
                            geometry: {
                              type: "LineString",
                              coordinates: [
                                toLatLng(route.points[0].chord).reverse(),
                                toLatLng(
                                  getCircleBeginPosition(
                                    route.points[0].chord,
                                    route.points[1].chord,
                                    route.points[2].chord,
                                    route.points[1].curveRadius,
                                  ),
                                ).reverse(),
                              ],
                            } satisfies LineString,
                            properties: null,
                          } satisfies Feature)
                        : ({
                            type: "Feature",
                            geometry: {
                              type: "LineString",
                              coordinates: [],
                            },
                            properties: null,
                          } satisfies Feature),
                      route.points.length > 2
                        ? ({
                            type: "Feature",
                            geometry: {
                              type: "LineString",
                              coordinates: [
                                toLatLng(
                                  route.points[route.points.length - 1].chord,
                                ).reverse(),
                                toLatLng(
                                  getCircleEndPosition(
                                    route.points[route.points.length - 3].chord,
                                    route.points[route.points.length - 2].chord,
                                    route.points[route.points.length - 1].chord,
                                    route.points[route.points.length - 2]
                                      .curveRadius,
                                  ),
                                ).reverse(),
                              ],
                            },
                            properties: null,
                          } satisfies Feature)
                        : ({
                            type: "Feature",
                            geometry: {
                              type: "LineString",
                              coordinates: [],
                            },
                            properties: null,
                          } satisfies Feature),
                      ...route.points
                        .map((point, index) => {
                          if (index === 0) return null;
                          if (index === route.points.length - 1) return null;

                          const before = route.points[index - 1];
                          const after = route.points[index + 1];

                          function getCircleChoord(
                            pos0: [number, number],
                            pos1: [number, number],
                            pos2: [number, number],
                            radius: number,
                          ): [number, number][] {
                            const posCenter = getCircleCenterPosition(
                              pos0,
                              pos1,
                              pos2,
                              radius,
                            );

                            {
                              const line: [number, number][] = [];
                              const clockwise = isClockwise(pos0, pos1, pos2);
                              const angleOffset = clockwise
                                ? Math.PI / 2
                                : -Math.PI / 2;

                              const start = normalizeAngle(
                                Math.atan2(
                                  pos0[0] - pos1[0],
                                  pos0[1] - pos1[1],
                                ) + angleOffset,
                              );
                              const end = normalizeAngle(
                                Math.atan2(
                                  pos2[0] - pos1[0],
                                  pos2[1] - pos1[1],
                                ) - angleOffset,
                              );
                              const ACCURACY = 20;
                              const arcAngle = getShortestArc(start, end);

                              const add = arcAngle / ACCURACY;

                              for (let i = 0; i <= ACCURACY; i++) {
                                const angle = start + add * i;
                                const addx = Math.sin(angle) * radius;
                                const addy = Math.cos(angle) * radius;

                                line.push(
                                  toLatLng([
                                    posCenter[0] + addx,
                                    posCenter[1] + addy,
                                  ]).reverse() as [number, number],
                                );
                              }

                              return line;
                            }
                          }
                          return getCircleChoord(
                            before.chord,
                            point.chord,
                            after.chord,
                            point.curveRadius,
                          );
                        })
                        .filter((v) => v)
                        .map(
                          (v) =>
                            ({
                              type: "LineString",
                              coordinates: v ?? [],
                            }) satisfies LineString,
                        )
                        .map(
                          (v) =>
                            ({
                              type: "Feature",
                              geometry: v,
                              properties: null,
                            }) satisfies Feature,
                        ),
                      ...route.points
                        .map((point, i) => {
                          if (i == 0 || i == 1) return;
                          if (i == route.points.length - 1) return;

                          const before2 = route.points[i - 2];
                          const before = route.points[i - 1];
                          const after = route.points[i + 1];

                          return [
                            toLatLng(
                              getCircleEndPosition(
                                before2.chord,
                                before.chord,
                                point.chord,
                                before.curveRadius,
                              ),
                            ).reverse(),
                            toLatLng(
                              getCircleBeginPosition(
                                before.chord,
                                point.chord,
                                after.chord,
                                point.curveRadius,
                              ),
                            ).reverse(),
                          ];
                        })
                        .filter((v) => v)
                        .map(
                          (v) =>
                            ({
                              type: "LineString",
                              coordinates: v ?? [],
                            }) satisfies LineString,
                        )
                        .map(
                          (v) =>
                            ({
                              type: "Feature",
                              geometry: v,
                              properties: null,
                            }) satisfies Feature,
                        ),
                    ])
                    .filter((v) => v != null),
                } satisfies FeatureCollection);
              }}
            >
              GeoJSON出力
            </Button>
            <Button
              variant="outlined"
              onClick={() => {
                if (
                  !window.confirm(
                    "現在入力されているデータは全て削除されます。続行しますか？",
                  )
                ) {
                  return;
                }
                const text = document.querySelector("textarea")!.value || "";
                try {
                  const obj = JSON.parse(text);
                  setSelectedRoute(obj[0]);
                  setRoute(obj);
                } catch {
                  /*  */
                }
              }}
            >
              JSON入力
            </Button>
          </div>
          <textarea id="output-json" style={{ flex: "1" }}></textarea>
        </div>
      </div>
    </div>
  );
}

export default App;
