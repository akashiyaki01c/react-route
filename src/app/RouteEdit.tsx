import { Button, TextInput } from "@mantine/core";
import { Route } from "../model/route";
import { State } from "../model/state";

interface Props {
  routes: Route[];
  selectedRoute: Route;
  setState: (state: State) => void;
  setSelectedRoute: React.Dispatch<React.SetStateAction<Route>>;
}

export function RouteEdit(props: Props) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.25em",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
          }}
        >
          <span style={{ marginInline: "1ric", fontWeight: "bold" }}>
            路線管理
          </span>
        </div>
        <div>
          <Button
            variant="outline"
            onClick={() => {
              const currentIndex =
                props.routes
                  .map((v, i) => (v.id === props.selectedRoute.id ? i : null))
                  .find((v) => v != null) || 0;
              props.routes[currentIndex] = props.selectedRoute;
              props.routes.push({
                id: crypto.randomUUID(),
                name: "新規路線",
                points: [],
                stations: [],
              });
              props.setState({ routes: props.routes });
              props.setSelectedRoute(props.routes[props.routes.length - 1]);
            }}
          >
            路線追加
          </Button>
        </div>
      </div>
      <div
        style={{
          height: "20em",
          overflow: "scroll",
          border: "1px black solid",
          padding: "0.5em",
        }}
      >
        {props.routes.map((v) => (
          <div
            key={v.id}
            style={{
              display: "flex",
              border:
                v.id === props.selectedRoute.id ? "2px solid #b4daff" : "",
              padding: v.id === props.selectedRoute.id ? "2px" : "4px",
              gap: "0.25em",
            }}
          >
            <TextInput
              style={{ width: "6ric", flex: "1" }}
              onChange={(e) => {
                v.name = e.target.value;
                props.setState({ routes: [...props.routes] });
              }}
              value={v.name}
            ></TextInput>
            <Button
              variant="outline"
              onClick={() => {
                props.setState({
                  routes: props.routes.filter((v1) => v.id !== v1.id),
                });
                props.setSelectedRoute(props.routes[props.routes.length - 1]);
              }}
            >
              削除
            </Button>
            <Button
              variant="contained"
              onClick={() => {
                const currentIndex =
                  props.routes
                    .map((v, i) => (v.id === props.selectedRoute.id ? i : null))
                    .find((v) => v != null) || 0;
                props.routes[currentIndex] = props.selectedRoute;
                props.setState({ routes: [...props.routes] });
                props.setSelectedRoute(
                  props.routes.find((v1) => v.id === v1.id) || props.routes[0],
                );
              }}
            >
              選択
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
