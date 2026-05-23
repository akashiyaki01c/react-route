import { Polyline } from "react-leaflet";
import { toLatLng } from "../model/convert";
import { Route } from "../model/route";
import { getCircleBeginPosition, getCircleEndPosition } from "../model/distance";

interface Props {
  routes: Route[];
  selectedRoute: Route;
}

export function RedRouteView(props: Props) {
  return (
    <>
      {props.selectedRoute.points.length == 2 ? (
        <Polyline
          positions={[
            toLatLng(props.selectedRoute.points[0].coord),
            toLatLng(props.selectedRoute.points[1].coord),
          ]}
          color="red"
        ></Polyline>
      ) : (
        <></>
      )}
      {props.selectedRoute.points.length > 2 ? (
        <Polyline
          positions={[
            toLatLng(props.selectedRoute.points[0].coord),
            toLatLng(
              getCircleBeginPosition(
                props.selectedRoute.points[0].coord,
                props.selectedRoute.points[1].coord,
                props.selectedRoute.points[2].coord,
                props.selectedRoute.points[1].curveRadius,
              ),
            ),
          ]}
          color="red"
        ></Polyline>
      ) : (
        <></>
      )}
      {props.selectedRoute.points.length > 2 ? (
        <Polyline
          positions={[
            toLatLng(
              props.selectedRoute.points[props.selectedRoute.points.length - 1].coord,
            ),
            toLatLng(
              getCircleEndPosition(
                props.selectedRoute.points[props.selectedRoute.points.length - 3].coord,
                props.selectedRoute.points[props.selectedRoute.points.length - 2].coord,
                props.selectedRoute.points[props.selectedRoute.points.length - 1].coord,
                props.selectedRoute.points[props.selectedRoute.points.length - 2]
                  .curveRadius,
              ),
            ),
          ]}
          color="red"
        ></Polyline>
      ) : (
        <></>
      )}
      {props.selectedRoute.points.map((point, i) => {
        if (i == 0 || i == 1) return;
        if (i == props.selectedRoute.points.length - 1) return;

        const before2 = props.selectedRoute.points[i - 2];
        const before = props.selectedRoute.points[i - 1];
        const after = props.selectedRoute.points[i + 1];

        return (
          <Polyline
            key={`${props.selectedRoute.id}_point${i}`}
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
      })}
    </>
  );
}
