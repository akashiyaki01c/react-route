import { Marker } from "react-leaflet";
import { toLatLng } from "../model/convert";
import { Route } from "../model/route";
import { Icon } from "leaflet";

interface Props {
	selectedRoute: Route,
	handleDragPoint: (index: number, e: unknown) => void;
}

const pointIcon = new Icon({
  iconUrl: "/images/point.svg",
  iconSize: [10, 10],
});

export function OresenView(props: Props) {
  return props.selectedRoute.points.map((point, index) => {
    const [lat, lng] = toLatLng(point.coord);
    return (
      <Marker
        key={point.id}
        position={[lat, lng]}
        draggable={true}
        icon={pointIcon}
        data-xy={point.coord}
        eventHandlers={{
          dragend: (e) => props.handleDragPoint(index, e), // ドラッグ終了時に新しい位置を更新
        }}
      />
    );
  });
}
