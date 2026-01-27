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
            toLatLng(props.selectedRoute.points[0].chord),
            toLatLng(props.selectedRoute.points[1].chord),
          ]}
          color="red"
        ></Polyline>
      ) : (
        <></>
      )}
      {props.selectedRoute.points.length > 2 ? (
        <Polyline
          positions={[
            toLatLng(props.selectedRoute.points[0].chord),
            toLatLng(
              getCircleBeginPosition(
                props.selectedRoute.points[0].chord,
                props.selectedRoute.points[1].chord,
                props.selectedRoute.points[2].chord,
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
              props.selectedRoute.points[props.selectedRoute.points.length - 1].chord,
            ),
            toLatLng(
              getCircleEndPosition(
                props.selectedRoute.points[props.selectedRoute.points.length - 3].chord,
                props.selectedRoute.points[props.selectedRoute.points.length - 2].chord,
                props.selectedRoute.points[props.selectedRoute.points.length - 1].chord,
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
                  before2.chord,
                  before.chord,
                  point.chord,
                  before.curveRadius,
                ),
              ),
              toLatLng(
                getCircleBeginPosition(
                  before.chord,
                  point.chord,
                  after.chord,
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
