import { JSX } from "react";
import { Route } from "../model/route";
import { getCircleBeginPosition, getCircleCenterPosition, getCircleEndPosition, getShortestArc, isClockwise, normalizeAngle } from "../model/distance";
import { Circle, Polyline } from "react-leaflet";
import { toLatLng } from "../model/convert";

interface Props {
  routes: Route[];
  selectedRoute: Route;
}

export function SelectedRouteView(props: Props) {
  return (
    <>
      {props.selectedRoute.points
        .map((point, index) => {
          if (index == 0) return <></>;
          if (index == props.selectedRoute.points.length - 1) return <></>;

          const before = props.selectedRoute.points[index - 1];
          const after = props.selectedRoute.points[index + 1];

          // 円の描画
          function getCircle(
            pos0: [number, number],
            pos1: [number, number],
            pos2: [number, number],
            radius: number,
          ): JSX.Element[] {
            const posCenter = getCircleCenterPosition(pos0, pos1, pos2, radius);
            const posBegin = getCircleBeginPosition(pos0, pos1, pos2, radius);
            const posEnd = getCircleEndPosition(pos0, pos1, pos2, radius);

            const circle = (
              <Circle
                key={`${props.selectedRoute.id}_${posCenter}`}
                center={toLatLng(posCenter)}
                radius={radius}
                fillOpacity={0}
                weight={0.5}
                color="black"
              ></Circle>
            );
            const circleLine = (
              <Polyline
                key={`${props.selectedRoute.id}_${posCenter}_1`}
                positions={[
                  toLatLng(posBegin),
                  toLatLng(posCenter),
                  toLatLng(posEnd),
                ]}
                weight={1}
                color="black"
              ></Polyline>
            );

            {
              const line = [];
              const clockwise = isClockwise(pos0, pos1, pos2);
              const angleOffset = clockwise ? Math.PI / 2 : -Math.PI / 2;

              const start = normalizeAngle(
                Math.atan2(pos0[0] - pos1[0], pos0[1] - pos1[1]) + angleOffset,
              );
              const end = normalizeAngle(
                Math.atan2(pos2[0] - pos1[0], pos2[1] - pos1[1]) - angleOffset,
              );
              const ACCURACY = 20;
              const arcAngle = getShortestArc(start, end);

              const add = arcAngle / ACCURACY;

              for (let i = 0; i <= ACCURACY; i++) {
                const angle = start + add * i;
                const addx = Math.sin(angle) * radius;
                const addy = Math.cos(angle) * radius;

                line.push(toLatLng([posCenter[0] + addx, posCenter[1] + addy]));
              }

              const circleLine2 = (
                <Polyline
                  key={`${props.selectedRoute.id}_${posCenter}_3`}
                  positions={line}
                  color="#ef4444ff"
                ></Polyline>
              );

              return [circle, circleLine, circleLine2];
            }
          }

          return getCircle(
            before.chord,
            point.chord,
            after.chord,
            point.curveRadius,
          );
        })
        .flat()
        .filter((v) => v != null)}
    </>
  );
}
