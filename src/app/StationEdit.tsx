import { Button, NumberInput, TextInput } from "@mantine/core";
import { Route, Station } from "../model/route";
import { State } from "../model/state";

interface Props {
  routes: Route[];
  selectedRoute: Route;
  setState: (state: State) => void;
  setSelectedRoute: React.Dispatch<React.SetStateAction<Route>>;
}

export function StationEdit(props: Props) {
  return (
    <div
      style={{
        height: "25%",
        display: "flex",
        gap: "0.25em",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          height: "20%",
          display: "flex",
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
            駅管理
          </span>
        </div>
        <div style={{ display: "flex", gap: "0.25em" }}>
          <Button
            variant="white"
            onClick={() => {
              props.selectedRoute.stations = props.selectedRoute.stations.sort(
                (a, b) => a.distance - b.distance,
              );
              props.setSelectedRoute({ ...props.selectedRoute });
            }}
          >
            駅ソート
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              props.selectedRoute.stations.push(new Station("", 0));
              props.setSelectedRoute({ ...props.selectedRoute });
            }}
          >
            駅追加
          </Button>
        </div>
      </div>
      <div
        style={{
          height: "70%",
          overflowY: "scroll",
          border: "1px black solid",
          padding: "2.5%",
        }}
      >
        {props.selectedRoute.stations.map((station, index) => (
          <div
            key={station.id}
            style={{ display: "flex", justifyContent: "space-between" }}
          >
            <div style={{ display: "flex", gap: "0.5em" }}>
              <div
                style={{ display: "flex", alignItems: "center", gap: "0.25em" }}
              >
                駅名
                <TextInput
                  style={{ width: "6ric" }}
                  type="text"
                  value={station.name}
                  onChange={(e) => {
                    station.name = e.target.value;
                    props.setSelectedRoute({ ...props.selectedRoute });
                  }}
                />
              </div>
              <div
                style={{ display: "flex", alignItems: "center", gap: "0.25em" }}
              >
                距離程
                <NumberInput
                  style={{ width: "6ric" }}
                  value={station.distance}
                  onValueChange={(e) => {
                    station.distance = Number.parseInt(e.formattedValue) || 0;
                    props.setSelectedRoute({ ...props.selectedRoute });
                  }}
                />
                m
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                props.selectedRoute.stations =
                  props.selectedRoute.stations.filter((_, i) => i !== index);
                props.setSelectedRoute({ ...props.selectedRoute });
              }}
            >
              削除
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
