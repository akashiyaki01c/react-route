import {
  LayerGroup,
  LayersControl,
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
} from "react-leaflet";
import { SelectedRouteView } from "./app/SelectedRouteView";
import { RedRouteView } from "./app/RedRouteView";
import { RouteView } from "./app/RouteView";
import { GetLatLngFromDistance, GetTotalDistance } from "./model/distance";
import { toLatLng } from "./model/convert";
import { Route } from "./model/route";
import { Icon } from "leaflet";

interface Props {
  mapClickHandler: ({
    onAddPoint,
  }: {
    onAddPoint: (lat: number, lng: number) => void;
  }) => null;
  handleDragPoint: (index: number, e: unknown) => void;
  handleAddPoint: (lat: number, lng: number) => void;
  routes: Route[],
  selectedRoute: Route,
}

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
const pointIcon = new Icon({
  iconUrl: "/images/point.svg",
  iconSize: [10, 10],
});

export function Map(props: Props) {
  return (
    <div style={{ height: "100dvh", width: "100%" }}>
      <MapContainer center={[35, 135]} zoom={10} style={{ height: "100%" }}>
        <props.mapClickHandler onAddPoint={props.handleAddPoint} />
        <LayersControl>
          <LayersControl.BaseLayer name="Open Street Map" checked>
            <TileLayer
              attribution='© <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Open Street Map (白色)">
            <TileLayer
              attribution="Map tiles by Carto, under CC BY 3.0. Data by OpenStreetMap, under ODbL."
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
              <RouteView routes={props.routes} selectedRoute={props.selectedRoute} />
              <SelectedRouteView
                routes={props.routes}
                selectedRoute={props.selectedRoute}
              />

              {/* 黒の折れ線描画 */}
              <Polyline
                positions={props.selectedRoute.points.map((v) => toLatLng(v.coord))}
                color="black"
                weight={1}
              ></Polyline>

              {/* 赤線描画 */}
              <RedRouteView
                routes={props.routes}
                selectedRoute={props.selectedRoute}
              />

              {/* 折れ点マーカー描画 */}
              {props.selectedRoute.points.map((point, index) => {
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
              })}
            </LayerGroup>
          </LayersControl.Overlay>

          <LayersControl.Overlay name="距離程">
            <LayerGroup>
              {/* 距離程描画 */}
              {[
                ...Array(
                  Math.floor(GetTotalDistance(props.selectedRoute.points) / 1000),
                ),
              ].map((_, i) => {
                const xy = GetLatLngFromDistance(
                  props.selectedRoute.points,
                  (i + 1) * 1000,
                );
                if (Number.isNaN(xy[0])) xy[0] = 0;
                if (Number.isNaN(xy[1])) xy[1] = 0;
                return (
                  <Marker
                    key={`${props.selectedRoute.id}_${i}`}
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
              {props.selectedRoute.stations.map((station) => {
                const xy = GetLatLngFromDistance(
                  props.selectedRoute.points,
                  station.distance,
                );
                if (Number.isNaN(xy[0])) xy[0] = 0;
                if (Number.isNaN(xy[1])) xy[1] = 0;
                return (
                  <Marker
                    key={`${props.selectedRoute.id}_${station.id}`}
                    position={toLatLng(xy)}
                    icon={selectedStationIcon}
                  >
                    <Popup>{station.name}</Popup>
                  </Marker>
                );
              })}
              {/* 駅マーカー描画 */}
              {props.routes
                .filter((v) => v.id !== props.selectedRoute.id)
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
  );
}
