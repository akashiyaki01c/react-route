import {
  LayerGroup,
  LayersControl,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
} from "react-leaflet";
import { SelectedRouteView } from "./app/SelectedRouteView";
import { RedRouteView } from "./app/RedRouteView";
import { RouteView } from "./app/RouteView";
import { GetLatLngFromDistance, GetTotalDistance } from "./model/distance";
import { toLatLng } from "./model/convert";
import { Icon } from "leaflet";
import { OresenView } from "./app/OresenView";
import { useMemo } from "react";
import { useRouteStore, useSelectedRoute } from "./store";

interface Props {
  mapClickHandler: ({
    onAddPoint,
  }: {
    onAddPoint: (lat: number, lng: number) => void;
  }) => null;
  handleDragPoint: (index: number, e: unknown) => void;
  handleAddPoint: (lat: number, lng: number) => void;
  pointerDistance: number;
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
const crossingIcon = new Icon({
  iconUrl: "/images/crossing.svg",
  iconSize: [20, 20],
});
const culvertIcon = new Icon({
  iconUrl: "/images/culvert.svg",
  iconSize: [20, 20],
});
const pointerIcon = new Icon({
  iconUrl: "/images/pointer.svg",
  iconSize: [10, 10],
});

export function Map(props: Props) {
  const selectedRoute = useSelectedRoute();
  const { state } = useRouteStore();

  console.log(state, selectedRoute);
  const pointerXY = GetLatLngFromDistance(
    selectedRoute.points,
    props.pointerDistance,
  );

  const kyoritei = useMemo(() => {
    return [
      ...Array(Math.floor(GetTotalDistance(selectedRoute.points) / 1000)),
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
    });
  }, [selectedRoute]);

  const crossing = useMemo(() => {
    return state.routes.flatMap((v) =>
      v.crossings.map((station) => {
        const xy = GetLatLngFromDistance(v.points, station.distance);
        if (Number.isNaN(xy[0])) xy[0] = 0;
        if (Number.isNaN(xy[1])) xy[1] = 0;
        return (
          <Marker
            key={`${v.id}_${station.id}`}
            position={toLatLng(xy)}
            icon={crossingIcon}
          >
            <Popup>{station.name}踏切</Popup>
          </Marker>
        );
      }),
    );
  }, [state.routes]);

  const culverts = useMemo(() => {
    return state.routes.flatMap((v) =>
      v.culverts.map((culvert) => {
        const xy = GetLatLngFromDistance(v.points, culvert.distance);
        if (Number.isNaN(xy[0])) xy[0] = 0;
        if (Number.isNaN(xy[1])) xy[1] = 0;
        return (
          <Marker
            key={`${v.id}_${culvert.id}`}
            position={toLatLng(xy)}
            icon={culvertIcon}
          >
            <Popup>{culvert.name}渠橋</Popup>
          </Marker>
        );
      }),
    );
  }, [state.routes]);

  const selectedStations = useMemo(() => {
    return selectedRoute.stations.map((station) => {
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
          <Popup>{station.name}駅</Popup>
        </Marker>
      );
    });
  }, [selectedRoute]);
  const stations = useMemo(() => {
    return state.routes
      .filter((v) => v.id !== selectedRoute.id)
      .flatMap((v) =>
        v.stations.map((station) => {
          const xy = GetLatLngFromDistance(v.points, station.distance);
          if (Number.isNaN(xy[0])) xy[0] = 0;
          if (Number.isNaN(xy[1])) xy[1] = 0;
          return (
            <Marker
              key={`${v.id}_${station.id}`}
              position={toLatLng(xy)}
              icon={stationIcon}
            >
              <Popup>{station.name}駅</Popup>
            </Marker>
          );
        }),
      );
  }, [selectedRoute.id, state.routes]);

  return (
    <div style={{ height: "100%", width: "100%" }}>
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
              <RouteView
                routes={state.routes}
                selectedRouteId={selectedRoute.id}
              />
              <SelectedRouteView selectedRoute={selectedRoute} />
              {/* 赤線描画 */}
              <RedRouteView selectedRoute={selectedRoute} />

              {/* 折れ点マーカー描画 */}
              <OresenView
                selectedRoute={selectedRoute}
                handleDragPoint={props.handleDragPoint}
              />
            </LayerGroup>
          </LayersControl.Overlay>

          <LayersControl.Overlay name="距離程">
            <LayerGroup>
              {/* 距離程描画 */}
              {kyoritei}
            </LayerGroup>
          </LayersControl.Overlay>
          <LayersControl.Overlay name="踏切">
            <LayerGroup>
              {/* 踏切マーカー描画 */}
              {crossing}
            </LayerGroup>
          </LayersControl.Overlay>
          <LayersControl.Overlay name="渠橋">
            <LayerGroup>
              {/* 渠橋マーカー描画 */}
              {culverts}
            </LayerGroup>
          </LayersControl.Overlay>
          <LayersControl.Overlay name="駅">
            <LayerGroup>
              {/* 駅マーカー描画 */}
              {selectedStations}
              {/* 駅マーカー描画 */}
              {stations}
            </LayerGroup>
          </LayersControl.Overlay>
          <LayersControl.Overlay name="ポインター">
            <LayerGroup>
              <Marker
                key={`pointer`}
                position={toLatLng(pointerXY)}
                icon={pointerIcon}
              ></Marker>
            </LayerGroup>
          </LayersControl.Overlay>
        </LayersControl>
      </MapContainer>
    </div>
  );
}
