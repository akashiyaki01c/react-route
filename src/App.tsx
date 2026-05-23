import { useMapEvents } from "react-leaflet/hooks";
import { FeatureCollection, LineString, Feature } from "geojson";

import "./leaflet.css";
import "./App.css";

import { RoutePoint } from "./model/route";
import { useState } from "react";
import { fromLatLng, toLatLng } from "./model/convert";
import {
  getCircleCenterPosition,
  getCircleBeginPosition,
  getCircleEndPosition,
  isClockwise,
  getShortestArc,
  normalizeAngle,
  GetCurveBeginDistance,
  GetCurveEndDistance,
  GetIA,
} from "./model/distance";
import { useRouteStore } from "./store";

import { Button, Grid } from "@mantine/core";
import { Map } from "./Map";
import { RouteEdit } from "./app/RouteEdit";
import { PointEdit } from "./app/PointEdit";
import { StationEdit } from "./app/StationEdit";
import { StateScheme } from "./model/state";

function App() {
  const { state, setState } = useRouteStore();
  const [selectedRoute, setSelectedRoute] = useState(state.routes[0]);
  const [fileHandle, setFileHandle] = useState(undefined);
  const getSelectedRoute = () => {
    if (state.routes.map(v => v.id).includes(selectedRoute.id)){
      return selectedRoute
    } else {
      setSelectedRoute(state.routes[0]);
      return state.routes[0];
    }
  };

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
    selectedRoute.points[index].coord = fromLatLng([
      e.target._latlng.lat,
      e.target._latlng.lng,
    ]);
    setSelectedRoute({ ...selectedRoute });
  };
  const handleAddPoint = (lat: number, lng: number) => {
    const [x, y] = fromLatLng([lat, lng]);
    const newPoint: RoutePoint = {
      id: crypto.randomUUID(),
      coord: [x, y],
      isEdge: false,
      curveRadius: 300,
    };
    const route = selectedRoute;
    route.points.push(newPoint);
    setState({ ...state, routes: [...state.routes] });
    setSelectedRoute({ ...route });
  };
  const handleDeletePoint = (id: string) => {
    const route = selectedRoute;
    route.points = route.points.filter((point) => point.id !== id);
    // setSelectedRoute(route);
  };

  return (
    <div style={{ display: "flex", width: "100dvw", height: "100dvh" }}>
      {/* 地図画面 */}
      <Grid w={"100dvw"} gap={0}>
        <Grid.Col span={8}>
          <Map
            mapClickHandler={MapClickHandler}
            handleDragPoint={handleDragPoint}
            handleAddPoint={handleAddPoint}
            routes={state.routes}
            selectedRoute={getSelectedRoute()}
          />
        </Grid.Col>
        <Grid.Col span={4}>
          {/* プロパティ画面 */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.5em",
              overflow: "scroll",
              minHeight: "100dvh",
              width: "100%",
              padding: "0.5em",
            }}
          >
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
            <RouteEdit
              routes={state.routes}
              selectedRoute={getSelectedRoute()}
              setState={setState}
              setSelectedRoute={setSelectedRoute}
            />
            <PointEdit
              routes={state.routes}
              selectedRoute={getSelectedRoute()}
              setState={setState}
              setSelectedRoute={setSelectedRoute}
              handleDeletePoint={handleDeletePoint}
            />
            <StationEdit
              routes={state.routes}
              selectedRoute={getSelectedRoute()}
              setState={setState}
              setSelectedRoute={setSelectedRoute}
            />
            <div
              style={{
                height: "20%",
                display: "flex",
                flexFlow: "column",
                gap: "0.25em",
              }}
            >
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25em" }}>
                <Button
                  variant="filled"
                  onClick={async () => {
                    try {
                      if (!fileHandle) {
                        const handle = await window.showSaveFilePicker({
                          suggestedName: "data.json",
                          types: [
                            {
                              description: "JSON File",
                              accept: {
                                "application/json": [".json"],
                              },
                            },
                          ],
                        });
                        setFileHandle(handle);
                      }
                      const writable = await fileHandle.createWritable();
                      await writable.write(JSON.stringify(state, null, 2));
                      await writable.close();
                      console.log("saved");
                    } catch (error) {
                      console.error(error);
                    }

                    document.querySelector("textarea")!.value = JSON.stringify(
                      state.routes,
                    );
                  }}
                >
                  JSON出力
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    document.querySelector("textarea")!.value = JSON.stringify(
                      selectedRoute.points
                        .map((point, index) => {
                          const isEdge =
                            index == 0 ||
                            index == selectedRoute.points.length - 1;
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
                          const ia = GetIA(
                            selectedRoute.points[index - 1].coord,
                            selectedRoute.points[index].coord,
                            selectedRoute.points[index + 1].coord,
                          );
                          const radius = point.curveRadius;

                          return {
                            start: Math.floor(bc),
                            end: Math.floor(ec),
                            direction: ia.direction,
                            ia: ia.ia,
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
                  variant="outline"
                  onClick={() => {
                    document.querySelector("textarea")!.value = JSON.stringify(
                      selectedRoute.points
                        .map((point, index) => {
                          const isEdge =
                            index == 0 ||
                            index == selectedRoute.points.length - 1;
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
                  variant="outline"
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
                  variant="outline"
                  onClick={() => {
                    document.querySelector("textarea")!.value = JSON.stringify({
                      type: "FeatureCollection",
                      features: state.routes
                        .flatMap((route) => [
                          route.points.length == 2
                            ? ({
                                type: "Feature",
                                geometry: {
                                  type: "LineString",
                                  coordinates: [
                                    toLatLng(route.points[0].coord).reverse(),
                                    toLatLng(route.points[1].coord).reverse(),
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
                                    toLatLng(route.points[0].coord).reverse(),
                                    toLatLng(
                                      getCircleBeginPosition(
                                        route.points[0].coord,
                                        route.points[1].coord,
                                        route.points[2].coord,
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
                                      route.points[route.points.length - 1]
                                        .coord,
                                    ).reverse(),
                                    toLatLng(
                                      getCircleEndPosition(
                                        route.points[route.points.length - 3]
                                          .coord,
                                        route.points[route.points.length - 2]
                                          .coord,
                                        route.points[route.points.length - 1]
                                          .coord,
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
                              if (index === route.points.length - 1)
                                return null;

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
                                  const clockwise = isClockwise(
                                    pos0,
                                    pos1,
                                    pos2,
                                  );
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
                                before.coord,
                                point.coord,
                                after.coord,
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
                                    before2.coord,
                                    before.coord,
                                    point.coord,
                                    before.curveRadius,
                                  ),
                                ).reverse(),
                                toLatLng(
                                  getCircleBeginPosition(
                                    before.coord,
                                    point.coord,
                                    after.coord,
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
                  variant="outline"
                  onClick={async () => {
                    if (
                      !window.confirm(
                        "現在入力されているデータは全て削除されます。続行しますか？",
                      )
                    ) {
                      return;
                    }

                    const [handle] = await (window).showOpenFilePicker({
                      types: [
                        {
                          description: "JSON Files",
                          accept: {
                            "application/json": [".json"],
                          },
                        },
                      ],
                    });
                    setFileHandle(handle);

                    try {
                      const file = await handle.getFile();
                      const text = await file.text();
                      const json = StateScheme.parse(JSON.parse(text));
                      console.log(json);
                      setState(json);
                      setSelectedRoute(state.routes[0]);
                    } catch (error) {
                      console.error(error);
                      alert("読み込みに失敗しました。")
                    }
                  }}
                >
                  JSON入力
                </Button>
              </div>
              <textarea id="output-json" style={{ flex: "1" }}></textarea>
            </div>
          </div>
        </Grid.Col>
      </Grid>
    </div>
  );
}

export default App;
