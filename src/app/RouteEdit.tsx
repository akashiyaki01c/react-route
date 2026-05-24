import { Button, Textarea, TextInput } from "@mantine/core";
import { getDefaultRoute } from "../model/route";
import { useRef, useState } from "react";
import { useRouteStore, useSelectedRoute } from "../store";

export function RouteEdit() {
  const { state, setState, setSelectedRouteId } = useRouteStore();
  const selectedRoute = useSelectedRoute();

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
              const route = getDefaultRoute();
              setState((state) => ({
                ...state,
                routes: [...state.routes, route],
              }));
              setSelectedRouteId(route.id);
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
        {state.routes.map((v, i) => (
          <div
            key={v.id}
            style={{
              display: "flex",
              border: v.id === selectedRoute.id ? "2px solid #b4daff" : "",
              padding: v.id === selectedRoute.id ? "2px" : "4px",
              gap: "0.25em",
            }}
          >
            <TextInput
              style={{ width: "6ric", flex: "1" }}
              onChange={(e) => {
                setState((state) => ({
                  ...state,
                  routes: state.routes.map((route) =>
                    v.id === route.id ? { ...v, name: e.target.name } : route,
                  ),
                }));
              }}
              value={v.name}
            ></TextInput>
            <Button
              variant="outline"
              onClick={() => {
                if (state.routes.length === 1) return;
                setState((state) => ({
                  ...state,
                  routes: state.routes.filter((route) => route.id !== v.id),
                }));
                setSelectedRouteId(state.routes[0].id);
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
                setSelectedRouteId(v.id);
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
            setState((state) => ({
              ...state,
              routes: state.routes.map((route, index) =>
                index === selectedRouteIndex
                  ? {
                      ...route,
                      terrains: inputTerrain
                        .split("\n")
                        .slice(1)
                        .map((v) => v.split("\t").map((v) => v.trim()))
                        .map((v) => ({
                          distance: Number.parseFloat(v[0]),
                          x: Number.parseFloat(v[1]),
                          y: Number.parseFloat(v[2]),
                          z: Number.parseFloat(v[3]),
                        })),
                    }
                  : route,
              ),
            }));
            dialogRef.current?.close();
          }}
        >
          確定
        </Button>
      </dialog>
    </div>
  );
}
