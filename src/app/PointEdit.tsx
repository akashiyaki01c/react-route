import { Button, TextInput } from "@mantine/core";
import {
  GetCurveBeginDistance,
  GetCurveEndDistance,
  GetIA,
  GetTotalDistance,
} from "../model/distance";
import { useRouteStore, useSelectedRoute } from "../store";
import { Route } from "../model/route";

const getDistanceStr = (distance: number) => {
  const rawKilo = distance / 1000;
  const kilo = Math.floor(rawKilo);
  const meter = Math.floor(distance % 1000);
  const mili = Math.floor((distance * 1000) % 1000);

  return `${kilo}K${meter.toString().padStart(3, "0")}M${mili.toString().padStart(3, "0")}`;
};
const decimalToDMS = (decimalDeg: number): string => {
  const deg = Math.trunc(decimalDeg); // 度
  const minDecimal = Math.abs(decimalDeg - deg) * 60;
  const min = Math.trunc(minDecimal); // 分
  const secDecimal = (minDecimal - min) * 60; // 秒の小数
  const sec = Math.floor(secDecimal); // 秒の整数部分
  const secFraction = Math.round((secDecimal - sec) * 100); // 秒の小数第2位
  const pad = (n: number, width: number) => n.toString().padStart(width, "0");
  return `${deg}°${pad(min, 2)}'${pad(sec, 2)}"${pad(secFraction, 2)}`;
};

interface Props {
  handleDeletePoint: (id: string) => void;
}

export function PointEdit(props: Props) {
  const { setState } = useRouteStore();
  const selectedRoute = useSelectedRoute();
  const updateSelectedRoute = (updater: (route: Route) => Route) => {
    setState((state) => ({
      ...state,
      routes: state.routes.map((route) =>
        route.id === selectedRoute.id ? updater(route) : route,
      ),
    }));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.25em" }}>
      <div
        style={{
          display: "flex",
          gap: "0.25em",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
          }}
        >
          <span style={{ marginInline: "1ric", fontWeight: "bold" }}>
            経点管理
          </span>
        </div>
        <div>
          <Button
            variant="outline"
            onClick={() => {
              if (selectedRoute.points.length === 0) {
                return;
              }

              props.handleDeletePoint(
                selectedRoute.points[selectedRoute.points.length - 1].id,
              );
            }}
          >
            1点削除
          </Button>
          <Button
            variant="subtle"
            onClick={() => {
              if (selectedRoute.points.length === 0) {
                return;
              }
              updateSelectedRoute((route) => ({ ...route, points: [] }));
            }}
          >
            全削除
          </Button>
        </div>
      </div>
      <div
        style={{
          height: "10em",
          overflowY: "scroll",
          border: "1px black solid",
          padding: "2.5%",
        }}
      >
        {selectedRoute.points.map((point, index) => {
          const isEdge = index == 0 || index == selectedRoute.points.length - 1;
          return (
            <div
              key={point.id}
              style={{ display: "flex" }}
              className="curve-data"
            >
              {isEdge ? (
                <div style={{ width: "8ric" }}>-</div>
              ) : (
                <div
                  style={{
                    width: "8ric",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  R=
                  <TextInput
                    type="number"
                    style={{ width: "4ric" }}
                    value={point.curveRadius}
                    onChange={(e) => {
                      updateSelectedRoute((route) => ({
                        ...route,
                        points: route.points.map((v, i) =>
                          i === index
                            ? {
                                ...v,
                                curveRadius:
                                  Number.parseInt(e.target.value) || 0,
                              }
                            : v,
                        ),
                      }));
                    }}
                  />
                  m
                </div>
              )}
              <div style={{ fontSize: "0.75em" }}>
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
                <div>
                  {isEdge ? (
                    <></>
                  ) : (
                    <div style={{ fontFamily: "monospace" }}>
                      IA{" "}
                      {decimalToDMS(
                        GetIA(
                          selectedRoute.points[index - 1].coord,
                          selectedRoute.points[index].coord,
                          selectedRoute.points[index + 1].coord,
                        ).ia,
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
  );
}
