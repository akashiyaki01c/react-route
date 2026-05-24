import { useMapEvents } from "react-leaflet/hooks";
import "./leaflet.css";
import "./App.css";

import { Route, RoutePoint } from "./model/route";
import { useMemo, useState } from "react";
import { fromLatLng } from "./model/convert";
import {
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
import { CrossingEdit } from "./app/CrossingEdit";
import { toGeoJSON } from "./geoJson";
import { Vertical } from "./Vertical";
import { GradientEdit } from "./app/GradientEdit";
import { CulvertEdit } from "./app/CulvertEdit";
import { StructureEdit } from "./app/StructureEdit";

function App() {
  const { state, setState, loadState, selectedRouteId } = useRouteStore();
  const [fileHandle, setFileHandle] = useState(undefined);
  const [pointerDistance, setPointerDistance] = useState(0);

  const updateSelectedRoute = (updater: (route: Route) => Route) => {
    setState((state) => ({
      ...state,
      routes: state.routes.map((route) =>
        route.id === selectedRouteId ? updater(route) : route,
      ),
    }));
  };

  const selectedRoute = useMemo(
    () => state.routes.find((v) => v.id === selectedRouteId)!,
    [selectedRouteId, state.routes],
  );

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
        }
      },
    });
    return null;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleDragPoint = (index: number, e: any) => {
    const newCoord = fromLatLng([e.target._latlng.lat, e.target._latlng.lng]);

    updateSelectedRoute((route) => ({
      ...route,
      points: route.points.map((point, i) =>
        i === index
          ? {
              ...point,
              coord: newCoord,
            }
          : point,
      ),
    }));
  };

  const handleAddPoint = (lat: number, lng: number) => {
    const [x, y] = fromLatLng([lat, lng]);

    const newPoint: RoutePoint = {
      id: crypto.randomUUID(),
      coord: [x, y],
      isEdge: false,
      curveRadius: 300,
    };

    updateSelectedRoute((route) => ({
      ...route,
      points: [...route.points, newPoint],
    }));
  };
  const handleDeletePoint = (id: string) => {
    updateSelectedRoute((route) => ({
      ...route,
      points: route.points.filter((point) => point.id !== id),
    }));
  };

  return (
    <div style={{ display: "flex", width: "100dvw", height: "100dvh" }}>
      {/* 地図画面 */}
      <Grid w={"100dvw"} gap={0}>
        <Grid.Col span={8}>
          <div style={{ width: "100%", height: "100dvh", overflow: "hidden" }}>
            <div style={{ width: "100%", height: "50%", overflow: "scroll" }}>
              <Map
                mapClickHandler={MapClickHandler}
                handleDragPoint={handleDragPoint}
                handleAddPoint={handleAddPoint}
                pointerDistance={pointerDistance}
              />
            </div>
            <div
              style={{
                width: "100%",
                height: "50%",
                maxHeight: "50%",
                overflow: "scroll",
              }}
            >
              <Vertical
                setPointerDistance={setPointerDistance}
                pointerDistance={pointerDistance}
              />
            </div>
          </div>
        </Grid.Col>
        <Grid.Col span={4}>
          {/* プロパティ画面 */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.5em",
              overflow: "scroll",
              maxHeight: "100dvh",
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
            <RouteEdit />
            <PointEdit handleDeletePoint={handleDeletePoint} />
            <StationEdit />
            <CrossingEdit />
            <CulvertEdit />
            <GradientEdit />
            <StructureEdit />
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
                      alert("保存しました！");
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
                    document.querySelector("textarea")!.value =
                      toGeoJSON(state);
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

                    const [handle] = await window.showOpenFilePicker({
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
                      console.log(json.routes[0].id);
                      loadState(json);
                    } catch (error) {
                      console.error(error);
                      alert("読み込みに失敗しました。");
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
