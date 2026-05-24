import { Button, NumberInput, TextInput } from "@mantine/core";
import { Route } from "../model/route";
import { useRouteStore, useSelectedRoute } from "../store";

export function CulvertEdit() {
  const { setState } = useRouteStore();
  const selectedRoute = useSelectedRoute();
  const updateSelectedRoute = (updater: (route: Route) => Route) => {
    setState((state) => ({
      ...state,
      routes: state.routes.map((route) =>
        route.id === selectedRoute.id ? updater(route) : route,
      ),
    }));
  };

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
            渠橋管理
          </span>
        </div>
        <div style={{ display: "flex", gap: "0.25em" }}>
          <Button
            variant="white"
            onClick={() => {
              updateSelectedRoute((route) => ({
                ...route,
                culverts: route.culverts.toSorted(
                  (a, b) => a.distance - b.distance,
                ),
              }));
            }}
          >
            渠橋ソート
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              updateSelectedRoute((route) => ({
                ...route,
                culverts: [
                  ...route.culverts,
                  {
                    id: crypto.randomUUID(),
                    name: "",
                    distance: 0,
                  },
                ],
              }));
            }}
          >
            渠橋追加
          </Button>
        </div>
      </div>
      <div
        style={{
          height: "10em",
          overflowY: "scroll",
          border: "1px black solid",
          padding: "2.5%",
        }}
      >
        {selectedRoute.culverts.map((culvert) => (
          <div
            key={culvert.id}
            style={{ display: "flex", justifyContent: "space-between" }}
          >
            <div style={{ display: "flex", gap: "0.5em" }}>
              <div
                style={{ display: "flex", alignItems: "center", gap: "0.25em" }}
              >
                渠橋名
                <TextInput
                  style={{ width: "6ric" }}
                  type="text"
                  value={culvert.name}
                  onChange={(e) => {
                    updateSelectedRoute((route) => ({
                      ...route,
                      culverts: route.culverts.map((v) =>
                        v.id === culvert.id
                          ? { ...v, name: e.target.value }
                          : v,
                      ),
                    }));
                  }}
                />
              </div>
              <div
                style={{ display: "flex", alignItems: "center", gap: "0.25em" }}
              >
                距離程
                <NumberInput
                  style={{ width: "6ric" }}
                  value={culvert.distance}
                  onValueChange={(e) => {
                    updateSelectedRoute((route) => ({
                      ...route,
                      culverts: route.culverts.map((v) =>
                        v.id === culvert.id
                          ? {
                              ...v,
                              distance: Number.parseInt(e.formattedValue) || 0,
                            }
                          : v,
                      ),
                    }));
                  }}
                />
                m
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                updateSelectedRoute((route) => ({
                  ...route,
                  culverts: route.culverts.filter((v) => v.id !== culvert.id),
                }));
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
