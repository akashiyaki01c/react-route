import { Button, Textarea, TextInput } from "@mantine/core";
import { Route } from "../model/route";
import { State } from "../model/state";
import { useRef, useState } from "react";

interface Props {
  routes: Route[];
  selectedRoute: Route;
  setState: (state: State) => void;
  setSelectedRoute: React.Dispatch<React.SetStateAction<Route>>;
}

export function RouteEdit(props: Props) {
  const [inputTerrain, setInputTerrain] = useState("");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);

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
                crossings: [],
                culverts: [],
                terrains: [],
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
          height: "10em",
          overflow: "scroll",
          border: "1px black solid",
          padding: "0.5em",
        }}
      >
        {props.routes.map((v, i) => (
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
              variant="outline"
              onClick={() => {
                setSelectedRouteIndex(i);
                dialogRef.current?.showModal();
              }}
            >
              標高入力
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
      <dialog ref={dialogRef}>
        <Textarea
          value={inputTerrain}
          onChange={(e) => setInputTerrain(e.target.value)}
        />
        <Button
          onClick={() => {
            props.routes[selectedRouteIndex].terrains = inputTerrain
              .split("\n")
              .slice(1)
              .map((v) => v.split("\t").map((v) => v.trim()))
              .map((v) => ({
                distance: Number.parseFloat(v[0]),
                x: Number.parseFloat(v[1]),
                y: Number.parseFloat(v[2]),
                z: Number.parseFloat(v[3]),
              }));
            props.setState({ routes: props.routes });
            dialogRef.current?.close();
          }}
        >
          確定
        </Button>
      </dialog>
    </div>
  );
}
