import { JSX } from "react";
import { Route } from "../model/route";
import { getCircleBeginPosition, getCircleCenterPosition, getCircleEndPosition, getShortestArc, isClockwise, normalizeAngle } from "../model/distance";
import { toLatLng } from "../model/convert";
import { Polyline } from "react-leaflet";

interface Props {
  routes: Route[];
  selectedRoute: Route;
}

export function RouteView(props: Props) {
  return (
    <>
      {/* 選択以外の路線描画 */}
      {props.routes
        .filter((v) => v.id !== props.selectedRoute.id)
        .map((route) => [
          route.points.map((point, index) => {
            if (index == 0) return <></>;
            if (index == route.points.length - 1) return <></>;

            const before = route.points[index - 1];
            const after = route.points[index + 1];

            function getCircle(
              pos0: [number, number],
              pos1: [number, number],
              pos2: [number, number],
              radius: number,
            ): JSX.Element[] {
              const posCenter = getCircleCenterPosition(
                pos0,
                pos1,
                pos2,
                radius,
              );

              {
                const line = [];
                const clockwise = isClockwise(pos0, pos1, pos2);
                const angleOffset = clockwise ? Math.PI / 2 : -Math.PI / 2;

                const start = normalizeAngle(
                  Math.atan2(pos0[0] - pos1[0], pos0[1] - pos1[1]) +
                    angleOffset,
                );
                const end = normalizeAngle(
                  Math.atan2(pos2[0] - pos1[0], pos2[1] - pos1[1]) -
                    angleOffset,
                );
                const ACCURACY = 20;
                const arcAngle = getShortestArc(start, end);

                const add = arcAngle / ACCURACY;

                for (let i = 0; i <= ACCURACY; i++) {
                  const angle = start + add * i;
                  const addx = Math.sin(angle) * radius;
                  const addy = Math.cos(angle) * radius;

                  line.push(
                    toLatLng([posCenter[0] + addx, posCenter[1] + addy]),
                  );
                }

                const circleLine2 = (
                  <Polyline
                    key={`${route.id}_line1`}
                    positions={line}
                    color="red"
                  ></Polyline>
                );

                return [circleLine2];
              }
            }

            return getCircle(
              before.coord,
              point.coord,
              after.coord,
              point.curveRadius,
            );
          }),
          route.points.length == 2 ? (
            <Polyline
              key={`${route.id}_line2`}
              positions={[
                toLatLng(route.points[0].coord),
                toLatLng(route.points[1].coord),
              ]}
              color="red"
            ></Polyline>
          ) : (
            <></>
          ),
          route.points.length > 2 ? (
            <Polyline
              key={`${route.id}_line3`}
              positions={[
                toLatLng(route.points[0].coord),
                toLatLng(
                  getCircleBeginPosition(
                    route.points[0].coord,
                    route.points[1].coord,
                    route.points[2].coord,
                    route.points[1].curveRadius,
                  ),
                ),
              ]}
              color="red"
            ></Polyline>
          ) : (
            <></>
          ),
          route.points.length > 2 ? (
            <Polyline
              key={`${route.id}_line4`}
              positions={[
                toLatLng(route.points[route.points.length - 1].coord),
                toLatLng(
                  getCircleEndPosition(
                    route.points[route.points.length - 3].coord,
                    route.points[route.points.length - 2].coord,
                    route.points[route.points.length - 1].coord,
                    route.points[route.points.length - 2].curveRadius,
                  ),
                ),
              ]}
              color="red"
            ></Polyline>
          ) : (
            <></>
          ),
          route.points.map((point, i) => {
            if (i == 0 || i == 1) return;
            if (i == route.points.length - 1) return;

            const before2 = route.points[i - 2];
            const before = route.points[i - 1];
            const after = route.points[i + 1];

            return (
              <Polyline
                key={`${point.id}_line5`}
                positions={[
                  toLatLng(
                    getCircleEndPosition(
                      before2.coord,
                      before.coord,
                      point.coord,
                      before.curveRadius,
                    ),
                  ),
                  toLatLng(
                    getCircleBeginPosition(
                      before.coord,
                      point.coord,
                      after.coord,
                      point.curveRadius,
                    ),
                  ),
                ]}
                color="red"
              ></Polyline>
            );
          }),
        ])}
    </>
  );
}
